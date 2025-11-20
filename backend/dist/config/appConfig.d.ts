export const pool: Pool;
export namespace config {
    let port: string | number;
    let nodeEnv: string;
    let corsOrigin: string;
    let apiRateLimit: number;
    let logLevel: string;
    namespace sdk {
        let defaultBaseUrl: string;
        let publicApiUrl: string;
        let defaultTimeout: number;
        let apiVersion: string;
    }
    namespace zcash {
        let rpcUrl: string | undefined;
        let rpcUser: string | undefined;
        let rpcPass: string | undefined;
    }
    let platformTreasuryAddress: string | undefined;
}
import { Pool } from 'pg';
