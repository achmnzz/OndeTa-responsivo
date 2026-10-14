import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import Feed from '../pages/Feed';
import CreatePost from '../pages/CreatePost';
import MapPage from '../pages/Map';
import PostDetail from '../pages/PostDetail';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/feed" element={<Feed />} />
      <Route path="/create-post" element={<CreatePost />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/posts/:id" element={<PostDetail />} />
    </Routes>
  );
}