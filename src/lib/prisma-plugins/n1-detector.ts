import { Prisma } from '@prisma/client';
// Assuming 'next-axiom' or a similar logger is set up.
// If not, replace log.warn with console.warn or appropriate logger.
// import { log } from 'next-axiom';

// Define a type for the call site, if possible and useful
interface CallSite {
  fileName: string;
  lineNumber: number;
  functionName?: string;
}

// Helper to get a simplified call site
function getCallSite(errorStack: string): CallSite | undefined {
  const lines = errorStack.split('\n');
  // More robust parsing logic might be needed depending on stack trace format
  const relevantLine = lines.find(line =>
    line.includes('/app/') && // Adjust if your relevant app code isn't under /app/
    !line.includes('node_modules') &&
    !line.includes('n1-detector.ts') &&
    !line.includes('PrismaClientFetcher') &&
    !line.includes('PrismaManager') // Exclude PrismaManager itself
  );

  if (!relevantLine) {
    return undefined;
  }

  // This regex is an attempt and might need refinement
  const match = relevantLine.match(/at\s+(?:async\s)?(?:([\w\.$<>\[\]\s]+)\s\()?(.+?):(\d+):(\d+)\)?/);

  if (match) {
    const filePath = match[2] || match[1]; // Path can be in group 1 or 2
    const lineNumber = parseInt(match[3], 10);
    // Check if group 1 looks like a function name or a path segment
    const functionName = match[1]?.includes('/') || match[1]?.includes('.') || !match[1] ? undefined : match[1];

    return {
      fileName: filePath.replace(process.cwd(), ''), // Get relative path
      lineNumber,
      functionName: functionName?.trim() || undefined,
    };
  }

  // Fallback for simpler stack trace lines if the regex fails
  const simpleMatch = relevantLine.match(/\(([^)]+)\)|([^\s]+)$/);
  if (simpleMatch) {
      const details = (simpleMatch[1] || simpleMatch[2] || '').split(':');
      if (details.length >= 2) {
          return {
              fileName: details[0].replace(process.cwd(), ''),
              lineNumber: parseInt(details[1], 10)
          };
      }
  }
  return undefined;
}


export function n1DetectorPlugin(): Prisma.Middleware {
  // Use a WeakMap if operations can be garbage collected, or manage Map size if not.
  const operationCounts = new Map<string, { count: number, timestamp: number }>(); // Store count and last timestamp
  const operationCallSites = new Map<string, CallSite[]>(); // Store multiple call sites
  const N1_WINDOW_MS = 150; // Time window to detect N+1 in milliseconds
  const N1_THRESHOLD = 2;   // Number of identical queries within window to trigger alert (e.g. >1)

  return async (params, next) => {
    if (process.env.NODE_ENV !== 'development') {
      return next(params);
    }

    const { model, action } = params;
    const isRelevantOperation = ['findUnique', 'findFirst', 'findMany'].includes(action);

    if (!isRelevantOperation || !model) {
      return next(params);
    }

    // Consider query arguments for a more precise signature, if needed.
    // Be cautious with large argument objects in the key.
    const operationSignature = `${model}.${action}-${JSON.stringify(params.args?.where || {})}`;
    const now = Date.now();
    const currentStack = new Error().stack || '';

    const entry = operationCounts.get(operationSignature);
    const sites = operationCallSites.get(operationSignature) || []; // Initialize sites array

    if (entry && (now - entry.timestamp < N1_WINDOW_MS)) {
      entry.count++;
      entry.timestamp = now; // Update timestamp for the latest call in the window
      const callSite = getCallSite(currentStack);
      if(callSite) sites.push(callSite);

      if (entry.count >= N1_THRESHOLD) {
        const uniqueSites = sites.reduce((acc, site) => {
            const key = `${site.fileName}:${site.lineNumber}`;
            if (!acc[key]) {
                acc[key] = { ...site, count: 0 };
            }
            acc[key].count!++;
            return acc;
        }, {} as Record<string, CallSite & { count?: number }>);

        const siteSummary = Object.values(uniqueSites)
            .map(s => `${s.fileName}:${s.lineNumber} (invoked ${s.count} times${s.functionName ? ` in ${s.functionName}` : ''})`)
            .join('\n  ');

        const warningMessage = `Potential N+1 detected for operation: ${model}.${action} (where: ${JSON.stringify(params.args?.where || {})}). Called ${entry.count} times within ${N1_WINDOW_MS}ms.`;
        console.warn(warningMessage, {
            model: model,
            action: action,
            where: params.args?.where,
            count: entry.count,
            callSitesSummary: siteSummary || "Could not determine call sites.",
        });
        // log.warn(warningMessage, { /* structured log */ });

        // Reset after warning to avoid spamming for the same batch
        operationCounts.delete(operationSignature);
        operationCallSites.delete(operationSignature);
      } else {
         operationCounts.set(operationSignature, entry); // Update entry
         operationCallSites.set(operationSignature, sites); // Update sites
      }
    } else {
      // New operation or outside time window (or first call)
      const callSite = getCallSite(currentStack);
      operationCounts.set(operationSignature, { count: 1, timestamp: now });
      operationCallSites.set(operationSignature, callSite ? [callSite] : []);
    }

    // Clean up old entries periodically to prevent memory leak
    // This cleanup is basic. A more sophisticated approach might use a LRU cache or WeakMap if keys allow.
    if (operationCounts.size > 500) { // Example threshold for cache size
      for (const [key, val] of operationCounts.entries()) {
        if (now - val.timestamp > N1_WINDOW_MS * 2) { // Clean entries older than e.g., 2x window
          operationCounts.delete(key);
          operationCallSites.delete(key);
        }
      }
    }
    return next(params);
  };
}
