import { useEffect, type ReactElement } from 'react';
import { useAppDispatch } from './hooks/redux.ts';
import { AppRouter } from './routes/AppRouter.tsx';
import { fetchProfile, setAuthInitialized } from './store/slices/authSlice.ts';
import { getAccessToken } from './utils';

function App(): ReactElement {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      dispatch(fetchProfile());
    } else {
      dispatch(setAuthInitialized());
    }
  }, [dispatch]);

  return <AppRouter />;
}

export default App;
