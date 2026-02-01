'use client';

import { useState } from 'react';
import { Spinner } from '@geist-ui/react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  date: string;
  orderSum?: number;
  volume?: number;
  sales?: number;
}

interface ChartProps {
  data: ChartData[];
  onRefresh?: () => void;
  loading?: boolean;
}

export default function Chart({ data, onRefresh, loading }: ChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [visibleLines, setVisibleLines] = useState({
    orderSum: true,
    volume: true,
    sales: true,
  });

  // Вычисляем суммы
  const totalOrderSum = data.reduce((sum, item) => sum + (item.orderSum || 0), 0);
  const totalVolume = data.reduce((sum, item) => sum + (item.volume || 0), 0);
  const totalSales = data.reduce((sum, item) => sum + (item.sales || 0), 0);

  const toggleLine = (key: keyof typeof visibleLines) => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const ChartComponent = chartType === 'line' ? LineChart : BarChart;

  return (
    <div className="w-full">
      {/* Кнопки управления */}
      <div className="flex gap-2 mb-4 items-center">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            {loading && <Spinner />}
            Обновить
          </button>
        )}
        <button
          onClick={() => setChartType('line')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            chartType === 'line'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Линейный график
        </button>
        <button
          onClick={() => setChartType('bar')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            chartType === 'bar'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Столбчатая диаграмма
        </button>
      </div>

      {/* Суммы */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-600 mb-1">Сумма заказа</div>
          <div className="text-2xl font-bold text-blue-700">
            {totalOrderSum.toLocaleString('ru-RU')}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-gray-600 mb-1">Объём</div>
          <div className="text-2xl font-bold text-green-700">
            {totalVolume.toLocaleString('ru-RU')}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-gray-600 mb-1">Продажи</div>
          <div className="text-2xl font-bold text-purple-700">
            {totalSales.toLocaleString('ru-RU')}
          </div>
        </div>
      </div>

      {/* Переключатели линий */}
      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={visibleLines.orderSum}
            onChange={() => toggleLine('orderSum')}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Сумма заказа</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={visibleLines.volume}
            onChange={() => toggleLine('volume')}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Объём</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={visibleLines.sales}
            onChange={() => toggleLine('sales')}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Продажи</span>
        </label>
      </div>

      {/* График */}
      <div className="bg-white p-4 rounded-lg border border-gray-300">
        <ResponsiveContainer width="100%" height={400}>
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {visibleLines.orderSum && (
              chartType === 'line' ? (
                <Line
                  type="monotone"
                  dataKey="orderSum"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Сумма заказа"
                />
              ) : (
                <Bar dataKey="orderSum" fill="#3b82f6" name="Сумма заказа" />
              )
            )}
            {visibleLines.volume && (
              chartType === 'line' ? (
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Объём"
                />
              ) : (
                <Bar dataKey="volume" fill="#10b981" name="Объём" />
              )
            )}
            {visibleLines.sales && (
              chartType === 'line' ? (
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Продажи"
                />
              ) : (
                <Bar dataKey="sales" fill="#8b5cf6" name="Продажи" />
              )
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

