import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

export default function NotFound() {
  return (
    <div className="notfound">
      <p className="notfound__code">404</p>
      <p className="empty__title">This page wandered off</p>
      <p className="empty__body">
        Even the best secretary misplaces a file now and then.
      </p>
      <Link to="/" className="btn btn--primary" style={{ marginTop: 10 }}>
        <Icon name="home" size={15} />
        Back home
      </Link>
    </div>
  );
}
