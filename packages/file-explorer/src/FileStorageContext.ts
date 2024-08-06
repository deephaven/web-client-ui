import { createContext } from 'react';
import { type FileStorage } from './FileStorage';

export const FileStorageContext = createContext<FileStorage | null>(null);

export default FileStorageContext;
