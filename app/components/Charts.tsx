"use client";

import { Doughnut, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// ─── Doughnut Chart (Category Breakdown) ───
export function DoughnutChart({
    data,
}: {
    data: { label: string; total: number; color: string }[];
}) {
    const chartData = {
        labels: data.map((d) => d.label),
        datasets: [
            {
                data: data.map((d) => d.total),
                backgroundColor: data.map((d) => d.color + "cc"),
                borderColor: data.map((d) => d.color),
                borderWidth: 2,
                hoverOffset: 8,
                spacing: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "65%",
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "rgba(13, 17, 23, 0.9)",
                titleColor: "#f0f2f5",
                bodyColor: "#c9d1d9",
                borderColor: "rgba(33, 38, 45, 0.5)",
                borderWidth: 1,
                cornerRadius: 12,
                padding: 12,
                callbacks: {
                    label: (ctx: { label: string; parsed: number }) => {
                        return ` $${ctx.parsed.toLocaleString("es-MX")}`;
                    },
                },
            },
        },
        animation: {
            animateRotate: true,
            duration: 1200,
        },
    };

    return <Doughnut data={chartData} options={options} />;
}

// ─── Bar Chart (Income vs Expenses) ───
export function BarChart({
    income,
    expenses,
}: {
    income: number;
    expenses: number;
}) {
    const chartData = {
        labels: ["Ingresos", "Gastos"],
        datasets: [
            {
                data: [income, expenses],
                backgroundColor: ["rgba(6, 214, 160, 0.7)", "rgba(251, 113, 133, 0.7)"],
                borderColor: ["#06d6a0", "#fb7185"],
                borderWidth: 2,
                borderRadius: 12,
                borderSkipped: false,
                barThickness: 60,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "rgba(13, 17, 23, 0.9)",
                titleColor: "#f0f2f5",
                bodyColor: "#c9d1d9",
                borderColor: "rgba(33, 38, 45, 0.5)",
                borderWidth: 1,
                cornerRadius: 12,
                padding: 12,
                callbacks: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label: (ctx: any) => {
                        return ` $${(ctx.parsed.y || 0).toLocaleString("es-MX")}`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: "#8b949e", font: { size: 12 } },
                border: { display: false },
            },
            y: {
                grid: { color: "rgba(33, 38, 45, 0.3)" },
                ticks: {
                    color: "#8b949e",
                    font: { size: 11 },
                    callback: (value: string | number) => `$${Number(value).toLocaleString("es-MX")}`,
                },
                border: { display: false },
            },
        },
        animation: {
            duration: 1000,
        },
    };

    return <Bar data={chartData} options={options} />;
}
