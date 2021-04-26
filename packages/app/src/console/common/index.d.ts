import React from 'react';

interface CodeProps {
  children: React.ReactNode;
  language: string;
}

export default class Code extends React.PureComponent<CodeProps> {}
