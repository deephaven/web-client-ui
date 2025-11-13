/**
 * Interface for tree nodes used in rebalancing
 */
export interface TreeNode {
  name: string;
  children: TreeNode[];
  value: number;
}

/**
 * Helper function to rebalance a tree according to the following rules:
 * - Each node value must equal the sum of its immediate children with adjustments
 * - Can only add to nodes, no subtraction
 * - Excess value from parents is distributed evenly among all children
 * - Minimize the sum of all leaf nodes
 *
 * The function does not mutate the tree. Instead, it returns an adjustments map
 * indicating how much to add to each node to achieve the balanced state.
 *
 * @example
 * Tree structure:
 *       root(20)
 *      /        \
 *   a(4)        b(6)
 *  /   \       /    \
 * c(5) d(1)  e(2)  f(3)
 *
 * After rebalancing, the adjusted values would be:
 *        root(20)
 *       /        \
 *    a(10)       b(10)
 *   /   \       /     \
 * c(7)  d(3)   e(4.5) f(5.5)
 *
 * The resulting adjustments map:
 * {
 *   "root": 0,
 *   "a": 6,
 *   "b": 4,
 *   "c": 2,
 *   "d": 2,
 *   "e": 2.5,
 *   "f": 2.5
 * }
 *
 * @param node The root of the tree to rebalance
 * @returns A map of node names to adjustment values
 */
export function rebalanceTree(node: TreeNode): Map<string, number> {
  const adjustments = new Map<string, number>();
  processNode(node, adjustments);
  return adjustments;
}

function isLeaf(node: TreeNode): boolean {
  return node.children.length === 0;
}

/**
 * Add a value to a subtree, distributing it evenly among all nodes
 * @param node Current node to process
 * @param amount Amount to add to this subtree
 * @param adjustments Mutable map to store adjustments
 */
function addToSubtree(
  node: TreeNode,
  amount: number,
  adjustments: Map<string, number>
): void {
  // Add the amount to this node's adjustment
  const prevAdjustment = adjustments.get(node.name) ?? 0;
  adjustments.set(node.name, prevAdjustment + amount);

  if (!isLeaf(node)) {
    // Distribute the addition evenly among children
    const additionPerChild = amount / node.children.length;

    node.children.forEach(child =>
      addToSubtree(child, additionPerChild, adjustments)
    );
  }
}

/**
 * Calculate adjustments map for a subtree
 * @param node Node to process
 * @param adjustments Mutable map to store adjustments
 * @returns The adjusted value for the current node
 */
function processNode(node: TreeNode, adjustments: Map<string, number>): number {
  if (isLeaf(node)) {
    return node.value;
  }

  // Recursively process children first and get their adjusted values
  const childrenAdjustedValues = node.children.map(child =>
    processNode(child, adjustments)
  );

  // Calculate the adjusted sum of children
  const adjustedChildrenSum = childrenAdjustedValues.reduce(
    (sum, value) => sum + value,
    0
  );

  // Ensure this node's value is at least the sum of children
  if (node.value <= adjustedChildrenSum) {
    const adjustment = adjustedChildrenSum - node.value;
    const prevAdjustment = adjustments.get(node.name) ?? 0;
    adjustments.set(node.name, prevAdjustment + adjustment);

    return adjustedChildrenSum;
  }

  // Node value exceeds children sum, distribute the excess evenly among all children
  const additionPerChild =
    (node.value - adjustedChildrenSum) / node.children.length;
  node.children.forEach(child => {
    addToSubtree(child, additionPerChild, adjustments);
  });

  return node.value;
}

export default rebalanceTree;
