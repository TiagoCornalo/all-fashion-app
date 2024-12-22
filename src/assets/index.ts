import Bill from './icons/bill.svg';
import Hammer from './icons/hammer.svg';
import HandShake from './icons/handshake.svg';
import Package from './icons/package.svg';

// Usamos el tipo del módulo SVG directamente
type SvgComponent = typeof Bill;
export type IconComponent = SvgComponent;

export {
  Bill,
  Hammer,
  HandShake,
  Package,
};