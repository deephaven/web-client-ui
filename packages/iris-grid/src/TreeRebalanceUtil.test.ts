import { rebalanceTree, type TreeNode } from './TreeRebalanceUtil';

interface InputTreeNode {
  name: string;
  value: number;
  children?: string[];
}

// Helper function to build tree from simplified format
function buildTree(
  nodes: InputTreeNode[],
  rootName: string = nodes[0].name
): TreeNode {
  const nodeMap = new Map(nodes.map(node => [node.name, node]));

  function buildNode(name: string): TreeNode {
    const simpleNode = nodeMap.get(name);
    if (!simpleNode) {
      throw new Error(`Node '${name}' not found`);
    }

    if (!simpleNode.children || simpleNode.children.length === 0) {
      // Leaf node
      return {
        name: simpleNode.name,
        children: [],
        value: simpleNode.value,
      };
    }

    // Parent node
    const children = simpleNode.children.map(childName => buildNode(childName));

    return {
      name: simpleNode.name,
      children,
      value: simpleNode.value,
    };
  }

  return buildNode(rootName);
}

describe('rebalanceTree', () => {
  describe('rebalanceTree', () => {
    it('should handle a simple tree where parent equals sum of children', () => {
      // Tree structure:
      //   root(10)
      //   /      \
      // a(4)    b(6)
      const root = buildTree([
        { name: 'root', value: 10, children: ['a', 'b'] },
        { name: 'a', value: 4 },
        { name: 'b', value: 6 },
      ]);

      const adjustments = rebalanceTree(root);

      // No adjustments needed since root(10) = a(4) + b(6)
      expect(adjustments.size).toBe(1);
      expect(adjustments.get('root')).toBe(0);
    });

    it('should increase parent when children sum exceeds parent value', () => {
      // Tree structure:
      //   root(5)
      //   /     \
      // a(4)   b(6)
      // Children sum = 10, but root = 5, so root should be adjusted to 10
      const root = buildTree([
        { name: 'root', value: 5, children: ['a', 'b'] },
        { name: 'a', value: 4 },
        { name: 'b', value: 6 },
      ]);

      const adjustments = rebalanceTree(root);

      expect(adjustments.get('root')).toBe(5); // root: 5 + 5 = 10
      expect(adjustments.has('a')).toBe(false);
      expect(adjustments.has('b')).toBe(false);
    });

    it('should distribute excess when parent exceeds children sum', () => {
      // Tree structure:
      //   root(10)
      //   /      \
      // a(2)    b(3)
      // Children sum = 5, but root = 10, so distribute excess (5) evenly
      const root = buildTree([
        { name: 'root', value: 10, children: ['a', 'b'] },
        { name: 'a', value: 2 },
        { name: 'b', value: 3 },
      ]);

      const adjustments = rebalanceTree(root);

      expect(adjustments.get('a')).toBe(2.5); // a: 2 + 2.5 = 4.5
      expect(adjustments.get('b')).toBe(2.5); // b: 3 + 2.5 = 5.5
      expect(adjustments.has('root')).toBe(false);
    });

    it('should handle multi-level tree with cascading adjustments', () => {
      // Tree structure:
      //      root(20)
      //     /        \
      //  left(5)   right(3)
      //  /     \       |
      // a(4)   b(6)   c(7)
      const root = buildTree([
        { name: 'root', value: 20, children: ['left', 'right'] },
        { name: 'left', value: 5, children: ['a', 'b'] },
        { name: 'right', value: 3, children: ['c'] },
        { name: 'a', value: 4 },
        { name: 'b', value: 6 },
        { name: 'c', value: 7 },
      ]);

      const adjustments = rebalanceTree(root);

      // Expected behavior:
      // 1. left needs to be at least a(4) + b(6) = 10, so adjust left by +5
      // 2. right needs to be at least c(7) = 7, so adjust right by +4
      // 3. root(20) > left(10) + right(7) = 17, so distribute excess (3) evenly
      expect(adjustments.get('left')).toBe(6.5); // 5 + 5 (to match children) + 1.5 (share of excess)
      expect(adjustments.get('right')).toBe(5.5); // 3 + 4 (to match children) + 1.5 (share of excess)
      expect(adjustments.get('a')).toBe(0.75); // 4 + 0.75 (share of excess)
      expect(adjustments.get('b')).toBe(0.75); // 6 + 0.75 (share of excess)
      expect(adjustments.get('c')).toBe(1.5); // 7 + 1.5 (share of excess)
    });

    it('should handle single leaf node (no adjustments needed)', () => {
      const root = buildTree([{ name: 'leaf', value: 5 }]);

      const adjustments = rebalanceTree(root);

      expect(adjustments.size).toBe(0);
    });

    it('should handle missing values (treated as 0)', () => {
      // Tree structure:
      //   root(5)
      //   /     \
      // a(0)   b(0)
      // Children sum = 0, root = 5, distribute 2.5 to each child
      const root = buildTree([
        { name: 'root', value: 5, children: ['a', 'b'] },
        { name: 'a', value: 0 },
        { name: 'b', value: 0 },
      ]);

      const adjustments = rebalanceTree(root);

      // Children sum = 0, root = 5, distribute 2.5 to each child
      expect(adjustments.get('a')).toBe(2.5);
      expect(adjustments.get('b')).toBe(2.5);
    });

    it('should handle empty children array', () => {
      const root = buildTree([{ name: 'root', value: 5 }]);

      const adjustments = rebalanceTree(root);

      // No children to distribute to, no adjustments needed
      expect(adjustments.size).toBe(0);
    });
  });
});
