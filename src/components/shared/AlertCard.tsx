import { Warning, Package, MoneyBag } from '../../assets';
import { Card, CardContent } from "..";
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { formatDateTime } from '../../utils';

interface AlertProps {
  type: string;
  message: string;
  priority: string;
  onRemove: () => void;
  date: Date;
}

const AlertCard = ({ type, message, priority, onRemove, date }: AlertProps) => {

  const getIcon = () => {
    switch (type) {
      case 'Stock': return <Warning />;
      case 'Pedido': return <Package />;
      case 'Cierre': return <MoneyBag />;
    }
  }

  const getColor = () => {
    switch (priority) {
      case 'high': return 'bg-red-400';
      case 'medium': return 'bg-yellow-400';
      case 'low': return 'bg-green-400';
    }
  }

  const getLink = () => {
    switch (type) {
      case 'Stock': return '/admin/products';
      case 'Pedido': return '/inventory';
      case 'Cierre': return '/billing';
      default: return '/notifications';
    }
  }

  const removeAlert = () => {
    onRemove();
  }

  return (
    <Card className={`w-full ${getColor()} text-white`}>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl drop-shadow-lg">
            {getIcon()}
          </div>
          <p className="font-medium">{message} - {formatDateTime(date)}hs</p>
        </div>
        <Link to={getLink()}>
          <Button variant='ghost' onClick={removeAlert}>
            Resolver
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default AlertCard;
