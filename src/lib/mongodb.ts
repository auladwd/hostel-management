import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows / ISP DNS servers failing Node.js querySrv for mongodb+srv://
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

/**
 * Automatically converts mongodb+srv:// to direct replica set nodes if SRV lookup is blocked by local DNS/ISP.
 */
async function getReliableMongoUri(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) {
    return uri;
  }

  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/\?]+)(\/([^?]*))?(\?(.*))?$/);
    if (!match) return uri;

    const [, user, pass, host, , db = '', , query = ''] = match;
    const srvRecords = await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
    if (!srvRecords || srvRecords.length === 0) return uri;

    let replicaSet = '';
    try {
      const txtRecords = await dns.promises.resolveTxt(host);
      for (const group of txtRecords) {
        const str = group.join('');
        const rsMatch = str.match(/replicaSet=([^&]+)/);
        if (rsMatch) replicaSet = rsMatch[1];
      }
    } catch {
      // Replica set name not found in TXT, continue
    }

    const hostsList = srvRecords.map((r) => `${r.name}:${r.port}`).join(',');
    let directUri = `mongodb://${encodeURIComponent(decodeURIComponent(user))}:${encodeURIComponent(decodeURIComponent(pass))}@${hostsList}/${db || 'admin'}?ssl=true&authSource=admin&retryWrites=true&w=majority`;
    if (replicaSet) {
      directUri += `&replicaSet=${replicaSet}`;
    }

    console.log('ℹ️ [MongoDB] Automatically converted SRV to direct replica-set seedlist for reliable local/Windows DNS resolution.');
    return directUri;
  } catch (err) {
    console.warn('⚠️ [MongoDB] SRV auto-resolution fallback skipped, using original URI:', err);
    return uri;
  }
}

/**
 * MongoDB Mongoose Connection Manager with Caching for Next.js Serverless & Route Handlers
 */
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    throw new Error('দয়া করে এনভায়রনমেন্ট ভেরিয়েবলে MONGODB_URI প্রদান করুন (Please configure MONGODB_URI).');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached.promise = (async () => {
      // First attempt with reliable converted URI (bypasses ECONNREFUSED on Windows/Bangladesh ISPs)
      const targetUri = await getReliableMongoUri(rawUri);
      try {
        return await mongoose.connect(targetUri, opts);
      } catch (firstErr: any) {
        // If converted or original fails, attempt retry with the other option
        if (targetUri !== rawUri) {
          console.warn('⚠️ [MongoDB] Retrying with original URI...');
          return await mongoose.connect(rawUri, opts);
        }
        throw firstErr;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
