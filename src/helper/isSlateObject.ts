export const isSlateObject = (value: Record<string, any>[]) => {
  return (
    value instanceof Array &&
    value.length !== 0 &&
    value.every(
      (node: any) =>
        typeof node === 'object' &&
        node !== null &&
        typeof node.type === 'string' &&
        Array.isArray(node.children),
    )
  )
}
