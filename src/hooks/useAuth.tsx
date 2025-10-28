import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { FirebaseUser } from '@/lib/firebase-types';

interface AuthContextType {
  user: User | null;
  adminData: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminData, setAdminData] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        console.log('Firebase user authenticated:', firebaseUser.uid);
        
        try {
          // Try both collection names to be safe
          const userDoc = await getDoc(doc(db, 'User', firebaseUser.uid));
          console.log('User document exists in "User" collection:', userDoc.exists());
          
          if (userDoc.exists()) {
            const data = userDoc.data() as FirebaseUser;
            console.log('User data:', data);
            console.log('User status:', data.status);
            console.log('User permissions:', data.permissions);
            console.log('Can approve users:', data.permissions?.canApproveUsers);
            
            if (data.status === 'approved' && data.permissions?.canApproveUsers === true) {
              setAdminData(data);
              console.log('✅ Admin access granted');
            } else {
              console.log('❌ Admin access denied - status or permissions issue');
              console.log('Expected: status="approved" and canApproveUsers=true');
              console.log('Actual: status="' + data.status + '" and canApproveUsers=' + data.permissions?.canApproveUsers);
              setAdminData(null);
              // Don't sign out automatically - let user see the issue
            }
          } else {
            console.log('❌ User document not found in Firestore');
            console.log('Creating admin user document...');
            
            // Create the admin user document if it doesn't exist
            try {
              const adminUserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || 'admin@latrics.com',
                name: 'Admin User',
                phone: '+1234567890',
                companyName: 'Latrics',
                jobTitle: 'Administrator',
                licenseId: 'ADMIN001',
                status: 'approved',
                isProjectManager: true,
                createdAt: Timestamp.now(),
                permissions: {
                  canCreateTemplates: true,
                  canApproveUsers: true,
                  canManageJobRoles: true
                }
              };
              
              await setDoc(doc(db, 'User', firebaseUser.uid), adminUserData);
              console.log('✅ Admin user document created successfully');
              setAdminData(adminUserData as FirebaseUser);
            } catch (createError) {
              console.error('❌ Error creating admin user document:', createError);
              setAdminData(null);
            }
          }
        } catch (error) {
          console.error('❌ Error checking user document:', error);
          setAdminData(null);
        }
      } else {
        setAdminData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, adminData, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
