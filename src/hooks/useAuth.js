// Import the Named export from Context
import { useAuth } from '../context/AuthContext';

// 1. Re-export as Default (For files using: import useAuth from '...')
export default useAuth;

// 2. Re-export as Named (For files using: import { useAuth } from '...')
export { useAuth };