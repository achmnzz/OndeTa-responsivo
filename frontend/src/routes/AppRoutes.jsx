import { useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigationType,
  useParams,
} from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import Feed from '../pages/Feed';
import CreatePost from '../pages/CreatePost';
import PostDetail from '../pages/PostDetail';

function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

function GuestOnly() {
  const { user } = useAuth();
  const location = useLocation();
  if (user) {
    const from = location.state?.from;
    const target = from ? `${from.pathname}${from.search ?? ''}` : '/feed';
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navigationType]);
  return null;
}

function EditPost() {
  const { id } = useParams();
  return <CreatePost key={`edit-${id}`} />;
}

export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/posts/:id" element={<PostDetail />} />

        <Route element={<GuestOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-post" element={<CreatePost key="create" />} />
          <Route path="/posts/:id/edit" element={<EditPost />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
