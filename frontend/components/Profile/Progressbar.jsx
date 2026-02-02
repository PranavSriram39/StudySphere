import { BarElement, Legend, LinearScale, Title, Tooltip } from "chart.js";
import { Chart as ChartJS } from "chart.js/auto";
import React, { useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";

ChartJS.register(LinearScale, BarElement, Title, Tooltip, Legend);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
    },
  },
};
const data = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
  datasets: [
    {
      label: "No of points",
      data: [20, 17, 30, 42, 28, 50],
      backgroundColor: [
        "rgba(255, 99, 132, 0.2)",
        "rgba(54, 162, 235, 0.2)",
        "rgba(255, 206, 86, 0.2)",
        "rgba(75, 192, 192, 0.2)",
        "rgba(153, 102, 255, 0.2)",
        "rgba(255, 159, 64, 0.2)",
      ],
      borderColor: [
        "rgba(255, 99, 132, 1)",
        "rgba(54, 162, 235, 1)",
        "rgba(255, 206, 86, 1)",
        "rgba(75, 192, 192, 1)",
        "rgba(153, 102, 255, 1)",
        "rgba(255, 159, 64, 1)",
      ],
      borderWidth: 1,
    },
  ],
};

const Progressbar = () => {
  const chartRef = useRef();

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef?.current?.chartInstance?.destroy();
      }
    };
  }, []);

  return (
    <div>
      <h2>Your Weekly Progress Report</h2>
      <Bar
        data={data}
        width={400}
        height={200}
        options={options}
        ref={chartRef}
      />
    </div>
  );
};

export default Progressbar;
