declare module '*.module.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.css?inline' {
  const content: string;
  export default content;
}

declare module '*.css?raw' {
  const content: string;
  export default content;
}

declare module '*.css';
