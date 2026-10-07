/**
 * Find a perfect matching in an undirected graph using Edmonds' blossom search.
 * Neighbor order determines which augmenting paths are preferred. Unlike a
 * bounded backtracking search, this decides feasibility in polynomial time.
 */
export function findPerfectMatching(
    adjacency: number[][],
): [number, number][] | undefined {
    const vertexCount = adjacency.length;
    if (vertexCount % 2 !== 0) {
        return undefined;
    }

    const partners = Array.from({ length: vertexCount }, () => -1);

    for (let root = 0; root < vertexCount; root++) {
        if (partners[root] !== -1) {
            continue;
        }

        const parents = Array.from({ length: vertexCount }, () => -1);
        let endpoint = findAugmentingEnd(adjacency, partners, parents, root);
        if (endpoint === -1) {
            // A perfect matching would provide an augmenting path from every
            // unmatched vertex, so this root proves no perfect matching exists.
            return undefined;
        }

        // Flip matched and unmatched edges on the path, adding one match.
        while (endpoint !== -1) {
            const parent = parents[endpoint];
            const nextEndpoint = partners[parent];
            partners[endpoint] = parent;
            partners[parent] = endpoint;
            endpoint = nextEndpoint;
        }
    }

    const matches: [number, number][] = [];
    for (let vertex = 0; vertex < vertexCount; vertex++) {
        if (vertex < partners[vertex]) {
            matches.push([vertex, partners[vertex]]);
        }
    }
    return matches;
}

function findAugmentingEnd(
    adjacency: number[][],
    partners: number[],
    parents: number[],
    root: number,
): number {
    const vertexCount = adjacency.length;
    // The base represents each contracted odd cycle (blossom). Parents keep
    // the original vertices so augmentation can expand it without recursion.
    const bases = Array.from({ length: vertexCount }, (_, index) => index);
    const queued = Array.from({ length: vertexCount }, () => false);
    const queue = [root];
    queued[root] = true;

    for (const vertex of queue) {
        for (const neighbor of adjacency[vertex]) {
            if (
                bases[vertex] === bases[neighbor] ||
                partners[vertex] === neighbor
            ) {
                continue;
            }

            if (
                neighbor === root ||
                (partners[neighbor] !== -1 &&
                    parents[partners[neighbor]] !== -1)
            ) {
                // An edge between two even levels closes an odd cycle. Shrink
                // both paths to their common ancestor and explore its exits.
                contractBlossom(
                    vertex,
                    neighbor,
                    bases,
                    partners,
                    parents,
                    queued,
                    queue,
                );
            } else if (parents[neighbor] === -1) {
                parents[neighbor] = vertex;
                if (partners[neighbor] === -1) {
                    return neighbor;
                }

                // Only even levels need to be explored: the odd level's sole
                // next alternating edge is its existing matched edge.
                const partner = partners[neighbor];
                queued[partner] = true;
                queue.push(partner);
            }
        }
    }
    return -1;
}

function contractBlossom(
    first: number,
    second: number,
    bases: number[],
    partners: number[],
    parents: number[],
    queued: boolean[],
    queue: number[],
): void {
    const base = findCommonBase(first, second, bases, partners, parents);
    const blossom = Array.from({ length: bases.length }, () => false);
    markBlossomPath(first, second, base, bases, partners, parents, blossom);
    markBlossomPath(second, first, base, bases, partners, parents, blossom);

    for (let member = 0; member < bases.length; member++) {
        if (blossom[bases[member]]) {
            bases[member] = base;
            if (!queued[member]) {
                queued[member] = true;
                queue.push(member);
            }
        }
    }
}

function findCommonBase(
    first: number,
    second: number,
    bases: number[],
    partners: number[],
    parents: number[],
): number {
    const ancestors = new Set<number>();
    let vertex = first;
    while (vertex !== -1) {
        const base = bases[vertex];
        ancestors.add(base);
        vertex = partners[base] === -1 ? -1 : parents[partners[base]];
    }

    vertex = second;
    while (!ancestors.has(bases[vertex])) {
        vertex = parents[partners[bases[vertex]]];
    }
    return bases[vertex];
}

function markBlossomPath(
    start: number,
    child: number,
    base: number,
    bases: number[],
    partners: number[],
    parents: number[],
    blossom: boolean[],
): void {
    let vertex = start;
    let nextChild = child;
    while (bases[vertex] !== base) {
        const partner = partners[vertex];
        blossom[bases[vertex]] = true;
        blossom[bases[partner]] = true;
        parents[vertex] = nextChild;
        nextChild = partner;
        vertex = parents[partner];
    }
}
