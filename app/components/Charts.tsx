"use client";

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    ChartData,
    ChartOptions
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom' as const,
            labels: {
                boxWidth: 12,
                padding: 15,
                font: { size: 11, weight: 'bold' },
                color: 'rgba(100, 116, 139, 0.8)'
            }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            padding: 12,
            cornerRadius: 12,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            usePointStyle: true,
        }
    }
};

export function DoughnutChart({ data }: { data: ChartData<"doughnut"> }) {
    const options: ChartOptions<"doughnut"> = {
        ...defaultOptions,
        cutout: '70%',
        plugins: {
            ...defaultOptions.plugins,
            legend: { ...defaultOptions.plugins?.legend, display: true }
        }
    };

    return (
        <div className="relative w-full h-64 md:h-80">
            <Doughnut data={data} options={options} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-[-20px]">
                <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">Gastos</p>
                </div>
            </div>
        </div>
    );
}

export function BarChart({ data }: { data: ChartData<"bar"> }) {
    const options: ChartOptions<"bar"> = {
        ...defaultOptions,
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 10, weight: 'bold' },
                    color: 'rgba(100, 116, 139, 0.6)'
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(100, 116, 139, 0.1)',
                },
                ticks: {
                    font: { size: 10 },
                    color: 'rgba(100, 116, 139, 0.6)',
                    callback: (value: string | number) => `$${Number(value) >= 1000 ? (Number(value) / 1000) + 'k' : value}`
                }
            }
        },
        plugins: {
            ...defaultOptions.plugins,
            legend: { display: false }
        }
    };

    return (
        <div className="w-full h-64 md:h-80">
            <Bar data={data} options={options} />
        </div>
    );
}
