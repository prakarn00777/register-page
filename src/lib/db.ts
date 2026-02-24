import "server-only";
import pg from 'pg';

// Return timestamps as ISO strings
pg.types.setTypeParser(1114, (str: string) => str); // timestamp without tz
pg.types.setTypeParser(1184, (str: string) => new Date(str).toISOString()); // timestamptz
pg.types.setTypeParser(1082, (str: string) => str); // date
pg.types.setTypeParser(20, (val: string) => parseInt(val, 10)); // int8/bigint → number

// ============================================
// Connection Pool (lazy init)
// ============================================
let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
    if (!_pool) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is required');
        }
        _pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
    }
    return _pool;
}

// ============================================
// Types
// ============================================
interface DbResult<T = any> {
    data: T | null;
    error: { message: string; code?: string; details?: string } | null;
}

type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'not_in' | 'contains';

interface Filter {
    column: string;
    op: FilterOp;
    value: any;
}

interface OrderClause {
    column: string;
    ascending: boolean;
}

// ============================================
// Supabase-compatible Query Builder
// ============================================
class QueryBuilder<T = any> implements PromiseLike<DbResult<T>> {
    private _table: string;
    private _op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
    private _selectCols = '*';
    private _mutationData: Record<string, any> | Record<string, any>[] | null = null;
    private _filters: Filter[] = [];
    private _orders: OrderClause[] = [];
    private _limitVal: number | null = null;
    private _offsetVal: number | null = null;
    private _returnSingle = false;
    private _returnMaybeSingle = false;
    private _returning: string | null = null;

    constructor(table: string) {
        this._table = table;
    }

    // --- Operation starters ---

    select(columns?: string): QueryBuilder<T> {
        if (this._op === 'insert' || this._op === 'update' || this._op === 'upsert') {
            this._returning = columns || '*';
            return this as any;
        }
        this._op = 'select';
        if (columns) {
            this._selectCols = columns;
        }
        return this as any;
    }

    insert(data: Record<string, any> | Record<string, any>[]): QueryBuilder<T> {
        this._op = 'insert';
        this._mutationData = data;
        return this as any;
    }

    update(data: Record<string, any>): QueryBuilder<T> {
        this._op = 'update';
        this._mutationData = data;
        return this as any;
    }

    upsert(data: Record<string, any> | Record<string, any>[]): QueryBuilder<T> {
        this._op = 'upsert';
        this._mutationData = data;
        return this as any;
    }

    delete(): QueryBuilder<T> {
        this._op = 'delete';
        return this as any;
    }

    // --- Filters ---

    eq(column: string, value: any): this {
        this._filters.push({ column, op: 'eq', value });
        return this;
    }

    neq(column: string, value: any): this {
        this._filters.push({ column, op: 'neq', value });
        return this;
    }

    gt(column: string, value: any): this {
        this._filters.push({ column, op: 'gt', value });
        return this;
    }

    gte(column: string, value: any): this {
        this._filters.push({ column, op: 'gte', value });
        return this;
    }

    lt(column: string, value: any): this {
        this._filters.push({ column, op: 'lt', value });
        return this;
    }

    lte(column: string, value: any): this {
        this._filters.push({ column, op: 'lte', value });
        return this;
    }

    like(column: string, pattern: string): this {
        this._filters.push({ column, op: 'like', value: pattern });
        return this;
    }

    in(column: string, values: any[]): this {
        this._filters.push({ column, op: 'in', value: values });
        return this;
    }

    /** JSONB containment: WHERE column @> '{"key":"value"}'::jsonb */
    contains(column: string, value: Record<string, any>): this {
        this._filters.push({ column, op: 'contains', value });
        return this;
    }

    not(column: string, operator: string, value: string): this {
        if (operator === 'in') {
            const inner = value.replace(/^\(/, '').replace(/\)$/, '');
            const vals = inner.split(',').map(v => v.replace(/^"/g, '').replace(/"$/g, '').trim());
            this._filters.push({ column, op: 'not_in', value: vals });
        }
        return this;
    }

    // --- Ordering & Pagination ---

    order(column: string, options?: { ascending?: boolean }): this {
        this._orders.push({ column, ascending: options?.ascending !== false });
        return this;
    }

    limit(n: number): this {
        this._limitVal = n;
        return this;
    }

    range(from: number, to: number): this {
        this._offsetVal = from;
        this._limitVal = to - from + 1;
        return this;
    }

    // --- Result modifiers ---

    single(): QueryBuilder<T> {
        this._returnSingle = true;
        return this as any;
    }

    maybeSingle(): QueryBuilder<T> {
        this._returnMaybeSingle = true;
        return this as any;
    }

    // --- Auto-execute on await ---

    then<R1 = DbResult<T>, R2 = never>(
        onf?: ((v: DbResult<T>) => R1 | PromiseLike<R1>) | null,
        onr?: ((e: any) => R2 | PromiseLike<R2>) | null,
    ): Promise<R1 | R2> {
        return this._execute().then(onf, onr);
    }

    // ============================================
    // Internal SQL generation & execution
    // ============================================

    private async _execute(): Promise<DbResult<T>> {
        try {
            switch (this._op) {
                case 'select': return await this._execSelect();
                case 'insert': return await this._execInsert();
                case 'update': return await this._execUpdate();
                case 'upsert': return await this._execUpsert();
                case 'delete': return await this._execDelete();
            }
        } catch (err: any) {
            return { data: null, error: { message: err.message, code: err.code, details: err.detail } };
        }
    }

    private _buildWhere(paramOffset = 0): { sql: string; values: any[] } {
        if (!this._filters.length) return { sql: '', values: [] };

        const parts: string[] = [];
        const values: any[] = [];
        let i = paramOffset + 1;

        for (const f of this._filters) {
            const col = `"${f.column}"`;
            switch (f.op) {
                case 'eq':
                    parts.push(`${col} = $${i++}`);
                    values.push(f.value ?? null);
                    break;
                case 'neq':
                    parts.push(`${col} != $${i++}`);
                    values.push(f.value ?? null);
                    break;
                case 'gt':
                    parts.push(`${col} > $${i++}`);
                    values.push(f.value);
                    break;
                case 'gte':
                    parts.push(`${col} >= $${i++}`);
                    values.push(f.value);
                    break;
                case 'lt':
                    parts.push(`${col} < $${i++}`);
                    values.push(f.value);
                    break;
                case 'lte':
                    parts.push(`${col} <= $${i++}`);
                    values.push(f.value);
                    break;
                case 'like':
                    parts.push(`${col} LIKE $${i++}`);
                    values.push(f.value);
                    break;
                case 'in': {
                    const arr = f.value as any[];
                    if (!arr.length) { parts.push('FALSE'); break; }
                    parts.push(`${col} IN (${arr.map(() => `$${i++}`).join(', ')})`);
                    values.push(...arr);
                    break;
                }
                case 'not_in': {
                    const arr = f.value as any[];
                    if (!arr.length) { parts.push('TRUE'); break; }
                    parts.push(`${col} NOT IN (${arr.map(() => `$${i++}`).join(', ')})`);
                    values.push(...arr);
                    break;
                }
                case 'contains':
                    parts.push(`${col} @> $${i++}::jsonb`);
                    values.push(JSON.stringify(f.value));
                    break;
            }
        }

        return { sql: ' WHERE ' + parts.join(' AND '), values };
    }

    private _buildOrderLimit(): string {
        let sql = '';
        if (this._orders.length) {
            sql += ' ORDER BY ' + this._orders.map(o =>
                `"${o.column}" ${o.ascending ? 'ASC' : 'DESC'}`
            ).join(', ');
        }
        if (this._limitVal !== null) sql += ` LIMIT ${this._limitVal}`;
        if (this._offsetVal !== null) sql += ` OFFSET ${this._offsetVal}`;
        return sql;
    }

    private _val(v: any): { ph: string; v: any } {
        if (v === undefined || v === null) return { ph: '', v: null };
        if (v instanceof Date) return { ph: '', v: v.toISOString() };
        if (typeof v === 'object') return { ph: '::jsonb', v: JSON.stringify(v) };
        return { ph: '', v };
    }

    private _returningClause(): string {
        if (!this._returning) return '';
        if (this._returning === '*') return ' RETURNING *';
        return ' RETURNING ' + this._returning.split(',').map(c => `"${c.trim()}"`).join(', ');
    }

    // --- SELECT ---
    private async _execSelect(): Promise<DbResult<T>> {
        const cols = this._selectCols === '*'
            ? '*'
            : this._selectCols.split(',').map(c => `"${c.trim()}"`).join(', ');

        let sql = `SELECT ${cols} FROM "${this._table}"`;
        const { sql: w, values } = this._buildWhere();
        sql += w + this._buildOrderLimit();

        const res = await getPool().query(sql, values);

        if (this._returnSingle) {
            return res.rows.length
                ? { data: res.rows[0] as T, error: null }
                : { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
        }
        if (this._returnMaybeSingle) {
            return { data: (res.rows[0] || null) as T, error: null };
        }
        return { data: res.rows as T, error: null };
    }

    // --- INSERT ---
    private async _execInsert(): Promise<DbResult<T>> {
        const recs = Array.isArray(this._mutationData) ? this._mutationData : [this._mutationData!];
        if (!recs.length) return { data: (this._returning ? [] : null) as T, error: null };

        const cols = Object.keys(recs[0]);
        const allVals: any[] = [];
        const rowPhs: string[] = [];
        let idx = 1;

        for (const rec of recs) {
            const phs: string[] = [];
            for (const c of cols) {
                const { ph, v } = this._val(rec[c]);
                phs.push(`$${idx++}${ph}`);
                allVals.push(v);
            }
            rowPhs.push(`(${phs.join(', ')})`);
        }

        const sql = `INSERT INTO "${this._table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES ${rowPhs.join(', ')}${this._returningClause()}`;
        const res = await getPool().query(sql, allVals);
        return this._formatMutationResult(res);
    }

    // --- UPDATE ---
    private async _execUpdate(): Promise<DbResult<T>> {
        const data = this._mutationData as Record<string, any>;
        if (!data) return { data: null, error: { message: 'No data for update' } };

        const cols = Object.keys(data);
        const allVals: any[] = [];
        let idx = 1;

        const sets = cols.map(c => {
            const { ph, v } = this._val(data[c]);
            allVals.push(v);
            return `"${c}" = $${idx++}${ph}`;
        });

        const { sql: w, values: wv } = this._buildWhere(allVals.length);
        allVals.push(...wv);

        const sql = `UPDATE "${this._table}" SET ${sets.join(', ')}${w}${this._returningClause()}`;
        const res = await getPool().query(sql, allVals);
        return this._formatMutationResult(res);
    }

    // --- UPSERT ---
    private async _execUpsert(): Promise<DbResult<T>> {
        const recs = Array.isArray(this._mutationData) ? this._mutationData : [this._mutationData!];
        if (!recs.length) return { data: (this._returning ? [] : null) as T, error: null };

        const cols = Object.keys(recs[0]);
        const allVals: any[] = [];
        const rowPhs: string[] = [];
        let idx = 1;

        for (const rec of recs) {
            const phs: string[] = [];
            for (const c of cols) {
                const { ph, v } = this._val(rec[c]);
                phs.push(`$${idx++}${ph}`);
                allVals.push(v);
            }
            rowPhs.push(`(${phs.join(', ')})`);
        }

        const updateCols = cols.filter(c => c !== 'id');
        const updateSet = updateCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');

        let sql = `INSERT INTO "${this._table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES ${rowPhs.join(', ')}`;
        sql += ` ON CONFLICT ("id") DO UPDATE SET ${updateSet}`;
        sql += this._returningClause();

        const res = await getPool().query(sql, allVals);
        return this._formatMutationResult(res);
    }

    // --- DELETE ---
    private async _execDelete(): Promise<DbResult<T>> {
        const { sql: w, values } = this._buildWhere();
        const sql = `DELETE FROM "${this._table}"${w}${this._returningClause()}`;
        const res = await getPool().query(sql, values);
        return this._formatMutationResult(res);
    }

    private _formatMutationResult(res: pg.QueryResult): DbResult<T> {
        if (!this._returning) return { data: null, error: null };
        if (this._returnSingle) {
            return res.rows.length
                ? { data: res.rows[0] as T, error: null }
                : { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
        }
        if (this._returnMaybeSingle) {
            return { data: (res.rows[0] || null) as T, error: null };
        }
        return { data: res.rows as T, error: null };
    }
}

// ============================================
// Supabase-compatible client
// ============================================
class PgClient {
    from(table: string): QueryBuilder {
        return new QueryBuilder(table);
    }
}

export const db = new PgClient();
export const dbAdmin = db;
export { getPool };
