'use client';

import { useState } from 'react';
import { Spinner } from '@geist-ui/react';
import Chart from './components/Chart';

interface ChartData {
  date: string;
  orderSum?: number;
  volume?: number;
  sales?: number;
}

const PROMPT_WEBHOOK = '/api/prompt-webhook';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Секция промпта и бинарного ответа
  const [prompt, setPrompt] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [responseContentType, setResponseContentType] = useState<string | null>(null);

  // Функция для парсинга даты в формате DDMMYYYY
  const parseDDMMYYYY = (dateStr: string | number | Date): string => {
    if (!dateStr) return new Date().toLocaleDateString('ru-RU');
    
    // Если это уже Date объект
    if (dateStr instanceof Date) {
      return dateStr.toLocaleDateString('ru-RU');
    }
    
    const dateString = String(dateStr).trim();
    
    // Проверяем формат DDMMYYYY (8 цифр)
    if (/^\d{8}$/.test(dateString)) {
      const day = dateString.substring(0, 2);
      const month = dateString.substring(2, 4);
      const year = dateString.substring(4, 8);
      
      // Проверяем валидность даты
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
        const date = new Date(yearNum, monthNum - 1, dayNum);
        if (date.getDate() === dayNum && date.getMonth() === monthNum - 1 && date.getFullYear() === yearNum) {
          return date.toLocaleDateString('ru-RU');
        }
      }
    }
    
    // Пытаемся распарсить как обычную дату
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('ru-RU');
    }
    
    // Если не удалось распарсить, возвращаем исходную строку
    return dateString;
  };

  const processData = (rawData: any): ChartData[] => {
    // Если данные уже в нужном формате
    if (Array.isArray(rawData)) {
      return rawData.map((item: any) => {
        // Приоритетно ищем колонку "Дата"
        const date = item['Дата'] || item['дата'] || item.Date || item.date || item.DATE || item.day || item.Day || new Date().toLocaleDateString('ru-RU');
        
        // Форматируем дату с учетом формата DDMMYYYY
        const formattedDate = parseDDMMYYYY(date);
        
        return {
          date: formattedDate,
          orderSum: item['Сумма заказа'] || item.orderSum || item.order_sum || item.sum || 0,
          volume: item['Объём'] || item.volume || item.Volume || item.объем || 0,
          sales: item['Продажи'] || item.sales || item.Sales || item.продажи || 0,
        };
      });
    }

    // Если данные в объекте с ключами-датами
    if (typeof rawData === 'object' && rawData !== null) {
      return Object.entries(rawData).map(([date, value]: [string, any]) => {
        // Если value - объект, ищем в нем колонку "Дата"
        const dateValue = (value && typeof value === 'object' && ('Дата' in value || 'дата' in value || 'Date' in value || 'date' in value))
          ? (value['Дата'] || value['дата'] || value.Date || value.date || date)
          : date;
        
        // Форматируем дату с учетом формата DDMMYYYY
        const formattedDate = parseDDMMYYYY(dateValue);
        
        return {
          date: formattedDate,
          orderSum: value?.orderSum || value?.order_sum || value?.['Сумма заказа'] || value?.sum || 0,
          volume: value?.volume || value?.Volume || value?.['Объём'] || value?.объем || 0,
          sales: value?.sales || value?.Sales || value?.['Продажи'] || value?.продажи || 0,
        };
      });
    }

    return [];
  };

  const handleLoadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.success) {
        const processed = processData(result.data);
        setChartData(processed);
      } else {
        setError(result.error || 'Ошибка загрузки данных');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    handleLoadData();
  };

  const handleSendPrompt = async () => {
    setImageLoading(true);
    setImageError(null);
    if (imageBlobUrl) {
      URL.revokeObjectURL(imageBlobUrl);
      setImageBlobUrl(null);
    }
    setResponseContentType(null);

    try {
      const response = await fetch(PROMPT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error((errBody as { error?: string }).error || `HTTP ${response.status}`);
      }
      const contentType = response.headers.get('content-type') || '';
      setResponseContentType(contentType);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageBlobUrl(url);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Ошибка запроса');
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center flex-col gap-4 p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold w-full text-center">Данные по сборке и продаже.</h1>

      {/* Промпт и вебхук */}
      <section className="w-[calc(100%-100px)] max-w-2xl border rounded-xl p-6 bg-white/80 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Что вы хотите увидеть?</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Введите пожелание..."
          rows={3}
          className="w-full max-h-24 px-4 py-3 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none box-border"
        />
        <button
          onClick={handleSendPrompt}
          disabled={imageLoading || !prompt.trim()}
          className="mt-3 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          {imageLoading && <Spinner />}
          {imageLoading ? 'Загрузка...' : 'Отправить'}
        </button>
        {imageError && (
          <p className="mt-2 text-red-600 text-sm">{imageError}</p>
        )}
        {imageLoading && (
          <div className="mt-4 flex flex-col items-center justify-center gap-3 py-12 border border-dashed border-yellow-300 rounded-lg bg-yellow-50/50">
            <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Ожидание ответа...</p>
            <p className="text-gray-400 text-sm">Файл загружается</p>
          </div>
        )}
        {!imageLoading && imageBlobUrl && (
          <div className="mt-4">
            {responseContentType?.startsWith('image/') ? (
              <img src={imageBlobUrl} alt="Ответ" className="max-w-full max-h-96 object-contain rounded-lg border" />
            ) : responseContentType?.includes('pdf') ? (
              <embed src={imageBlobUrl} type="application/pdf" className="w-full min-h-[400px] rounded-lg border" />
            ) : (
              <div className="flex items-center gap-2">
                <a href={imageBlobUrl} download="response.bin" className="text-yellow-600 hover:underline font-medium">Скачать файл</a>
              </div>
            )}
          </div>
        )}
      </section>
      
      <div className="w-full flex justify-center">
        <button
          onClick={handleLoadData}
          disabled={loading}
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 text-lg flex items-center gap-2"
        >
          {loading && <Spinner />}
          {loading ? 'Загрузка...' : 'Загрузить данные'}
        </button>
      </div>
      
      {error && (
        <div className="w-full p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-semibold">Ошибка:</p>
          <p>{error}</p>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="w-full">
          <Chart data={chartData} onRefresh={handleRefresh} loading={loading} />
        </div>
      )}
    </main>
  );
}

