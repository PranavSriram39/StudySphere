import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { Medal } from "lucide-react";

const CustomGraphColumn = ({ value, data }) => {
  const generateChartData = (data) => {
    const chartData = data?.slice(0, -1).map((point, index) => ({
      name: `Past${index + 1}`,
      points: point,
    }));

    chartData?.push({ name: "Current", points: value });

    return chartData;
  };

  const chartData = generateChartData(data);

  return (
    <ResponsiveContainer width="100%" height={30}>
      <LineChart
        data={chartData}
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        <YAxis hide />
        <Line
          animationBegin={0}
          animationDuration={500}
          animationEasing="ease-in-out"
          isAnimationActive={true}
          type="monotone"
          dataKey="points"
          stroke="#8884d8"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const MedalItem = (rank) => {
  return rank.rank == 1 ? (
    <Medal className="h-7 w-7 text-[#F3CC3C] animate-pulse" />
  ) : rank.rank == 2 ? (
    <Medal className="h-6 w-6 text-gray-500 animate-pulse" />
  ) : rank.rank == 3 ? (
    <Medal className="h-5 w-5 text-orange-400 animate-pulse" />
  ) : null;
};

const LeaderTable = ({ data }) => {
  const columns = [
    { width: 70, renderCell: (params) => <MedalItem rank={params.row.id} /> },
    { field: "id", headerName: "Rank", width: 70 },
    { field: "username", headerName: "username", width: 130 },
    // { field: "Channel", headerName: "Channel", width: 130 },
    {
      field: "currentPoints",
      headerName: "Points",
      type: "number",
      width: 130,
      sortable: true,
    },
    {
      field: "Graph",
      headerName: "Graph",
      width: 150,
      renderCell: (params) => (
        <CustomGraphColumn
          value={params.row.currentPoints}
          data={params.row.pastPoints}
        />
      ),
    },
  ];

  const rows = [
    {
      id: 1,
      Channel: "Snow",
      Username: "Jon",
      Points: 35,
      PastPerformance: [5, 10, 15, 20],
    },
    {
      id: 2,
      Channel: "Lannister",
      Username: "Cersei",
      Points: 42,
      PastPerformance: [5, 10, 15, 20],
    },
    {
      id: 3,
      Channel: "Lannister",
      Username: "Jaime",
      Points: 45,
      PastPerformance: [5, 10, 15, 20],
    },
    {
      id: 4,
      Channel: "Stark",
      Username: "Arya",
      Points: 16,
      PastPerformance: [5, 10, 15, 20],
    },
    {
      id: 5,
      Channel: "Targaryen",
      Username: "Daenerys",
      Points: 70,
      PastPerformance: [5, 10, 15, 80],
    },
    {
      id: 6,
      Channel: "Melisandre",
      Username: "Hadh",
      Points: 150,
      PastPerformance: [5, 10, 15, 50],
    },
    {
      id: 7,
      Channel: "Clifford",
      Username: "Ferrara",
      Points: 44,
      PastPerformance: [5, 10, 15, 20],
    },
    {
      id: 8,
      Channel: "Frances",
      Username: "Rossini",
      Points: 36,
      PastPerformance: [5, 10, 15, 20],
    },
    {
      id: 9,
      Channel: "Roxie",
      Username: "Harvey",
      Points: 65,
      PastPerformance: [5, 80, 60, 150],
    },
    {
      id: 10,
      Channel: "Roxie",
      Username: "Harvey",
      Points: 65,
      PastPerformance: [5, 10, 15, 20],
    },
    {
      id: 11,
      Channel: "Roxie",
      Username: "Harvey",
      Points: 65,
      PastPerformance: [5, 10, 15, 20],
    },
    {
      id: 12,
      Channel: "Roxie",
      Username: "Harvey",
      Points: 65,
      PastPerformance: [5, 10, 15, 20],
    },
    {
      id: 13,
      Channel: "Roxie",
      Username: "Harvey",
      Points: 65,
      PastPerformance: [5, 10, 15, 20],
    },
    {
      id: 14,
      Channel: "Roxie",
      Username: "Harvey",
      Points: 65,
      PastPerformance: [5, 10, 15, 20],
    },
    {
      id: 15,
      Channel: "Roxie",
      Username: "Harvey",
      Points: 65,
      PastPerformance: [5, 10, 15, 20],
    },
    {
      id: 16,
      Channel: "Roxie",
      Username: "Harvey",
      Points: 65,
      PastPerformance: [5, 10, 15, 20],
    },
    {
      id: 17,
      Channel: "Roxie",
      Username: "Harvey",
      Points: 65,
      PastPerformance: [5, 10, 15, 20],
    },
  ];
  return (
    <div className="mx-5 md:mx-24 max-w-[90vw] my-7 bg-white shadow-sm rounded-xl">
      <DataGrid
        className="max-h-[90vh] md:max-h-[80vh] px-6 py-4"
        style={{ fontSize: "18px" }}
        rows={data}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              page: 0,
              pageSize: 7,
            },
          },
        }}
        pageSizeOptions={[7, 14]}
        isRowSelectable={false}
      />
    </div>
  );
};

export default LeaderTable;
