import React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { ArrowLeft } from "lucide-react";

const QuizTable = ({ setSubmissionTrue, submissionData }) => {
  return (
    <div className="flex flex-col gap-6 h-full">
      <button
        onClick={() => setSubmissionTrue(false)}
        className="bg-blue-500 text-white rounded-md px-4 py-2  w-fit flex gap-2 lg:mx-10 mx-2"
      >
        <ArrowLeft />
        Back
      </button>
      {submissionData.length !== 0 ? (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Student Email</TableCell>
                <TableCell>Points</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissionData &&
                submissionData?.map((data, index) => (
                  <TableRow
                    key={index}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {data?.user?.name}
                    </TableCell>
                    <TableCell>{data?.user?.email}</TableCell>
                    <TableCell>{data?.points}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <div className="flex justify-center items-center h-full">
          <p className="text-lg">Student has not submitted quiz yet.</p>
        </div>
      )}
    </div>
  );
};

export default QuizTable;
