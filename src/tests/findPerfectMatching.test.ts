import assert from "node:assert/strict";
import { describe, it } from "mocha";
import { findPerfectMatching } from "../renderer/utils/findPerfectMatching.ts";

function graph(vertexCount: number, edges: [number, number][]): number[][] {
    const adjacency = Array.from({ length: vertexCount }, () => [] as number[]);
    for (const [first, second] of edges) {
        adjacency[first].push(second);
        adjacency[second].push(first);
    }
    return adjacency;
}

function hasPerfectMatching(
    adjacency: number[][],
    remaining: number[],
): boolean {
    if (remaining.length === 0) {
        return true;
    }
    const [first, ...rest] = remaining;
    return rest.some(
        (neighbor) =>
            adjacency[first].includes(neighbor) &&
            hasPerfectMatching(
                adjacency,
                rest.filter((vertex) => vertex !== neighbor),
            ),
    );
}

function assertValidMatching(
    adjacency: number[][],
    matches: [number, number][],
): void {
    assert.equal(matches.length * 2, adjacency.length);
    assert.equal(new Set(matches.flat()).size, adjacency.length);
    let previousFirst = -1;
    for (const [first, second] of matches) {
        assert.ok(first > previousFirst);
        assert.ok(first < second);
        assert.ok(adjacency[first].includes(second));
        previousFirst = first;
    }
}

describe("findPerfectMatching", () => {
    it("handles empty and odd fields and disconnected unmatchable fields", () => {
        assert.deepEqual(findPerfectMatching([]), []);
        assert.equal(findPerfectMatching([[]]), undefined);
        assert.equal(findPerfectMatching([[], []]), undefined);
        assert.equal(
            findPerfectMatching(
                graph(4, [
                    [0, 1],
                    [0, 2],
                    [0, 3],
                ]),
            ),
            undefined,
        );
    });

    it("respects neighbor order and leaves the graph unchanged", () => {
        const adjacency = graph(4, [
            [0, 2],
            [0, 1],
            [0, 3],
            [1, 2],
            [1, 3],
            [2, 3],
        ]);
        const before = structuredClone(adjacency);
        assert.deepEqual(findPerfectMatching(adjacency), [
            [0, 2],
            [1, 3],
        ]);
        assert.deepEqual(adjacency, before);
    });

    it("augments through an odd-cycle blossom instead of stranding its last vertex", () => {
        // 0-1 is matched first. From root 2, the triangle must be contracted
        // before the path 2-1-0-3 can replace that match with two matches.
        const adjacency = graph(4, [
            [0, 1],
            [0, 2],
            [1, 2],
            [0, 3],
        ]);
        assert.deepEqual(findPerfectMatching(adjacency), [
            [0, 3],
            [1, 2],
        ]);
    });

    it("agrees with exhaustive search for every undirected six-vertex graph", () => {
        const edges: [number, number][] = [];
        for (let first = 0; first < 6; first++) {
            for (let second = first + 1; second < 6; second++) {
                edges.push([first, second]);
            }
        }
        const vertices = [0, 1, 2, 3, 4, 5];
        for (let mask = 0; mask < 2 ** edges.length; mask++) {
            const presentEdges = edges.filter(
                (_, index) => Math.floor(mask / 2 ** index) % 2 === 1,
            );
            const adjacency = graph(vertices.length, presentEdges);
            const matches = findPerfectMatching(adjacency);
            assert.equal(
                matches != null,
                hasPerfectMatching(adjacency, vertices),
                `Graph ${mask}`,
            );
            if (matches != null) {
                assertValidMatching(adjacency, matches);
            }
        }
    });
});
