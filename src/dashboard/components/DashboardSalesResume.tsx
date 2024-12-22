import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ChartConfig,
  ChartContainer
} from '../../components';

import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from "recharts";

const DashboardSalesResume = () => {

  const chartData = [
    { name: 'Lunes', ventas: 45231.89, pedidos: 24 },
    { name: 'Martes', ventas: 38456.32, pedidos: 19 },
    { name: 'Miércoles', ventas: 52145.67, pedidos: 28 },
    { name: 'Jueves', ventas: 41789.45, pedidos: 22 },
    { name: 'Viernes', ventas: 49876.12, pedidos: 26 },
    { name: 'Sábado', ventas: 35678.90, pedidos: 17 },
    { name: 'Domingo', ventas: 28945.23, pedidos: 15 }
  ];

  const chartConfig: ChartConfig = {
    ventas: {
      label: "Ventas",
      color: "#2563eb",
    },
    pedidos: {
      label: "Pedidos",
      color: "#60a5fa",
    },
  };

  const todaySales = chartData.find(day => day.name === 'Lunes')?.ventas || 0;

  return (
    <div className='flex flex-col gap-4 w-full md:w-1/2'>
      {/* Ventas de hoy */}
      <Card className='w-full'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Ventas hoy</CardTitle>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            className='h-4 w-4 text-muted-foreground'
          >
            <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
          </svg>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>${todaySales.toLocaleString()}</div>
          <p className='text-xs text-muted-foreground'>+20.1% desde ayer</p>
        </CardContent>
      </Card>

      {/* Gráfico Semanal */}
      <Card className='w-full'>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Bar dataKey="ventas" fill={chartConfig.ventas.color} radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>
    </div>
  );
};

export default DashboardSalesResume;
