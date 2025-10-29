import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Typography, TextField
} from '@mui/material';

export default function StudentViewDialog({ open, onClose, student }) {
  if (!student) return null;

// helper: render the pair only if value is truthy
const Field = ({ label, value }) =>
  value ? (
    <Grid item xs={12} sm={6}>
      <TextField
        label={label}
        value={value}
        fullWidth
        InputProps={{ readOnly: true }}
        variant="standard"
      />
    </Grid>
  ) : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{student.name} – Full Details</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Personal
        </Typography>
        <Grid container spacing={2}>
          <Field label="Father's Name" value={student.father_name} />
          <Field label="Blood Group"   value={student.blood_group} />
          <Field label="Current Address"   value={student.current_address} />
          <Field label="Permanent Address" value={student.permanent_address} />
        </Grid>

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
          10th Details
        </Typography>
        <Grid container spacing={2}>
          <Field label="School" value={student.s10_school} />
          <Field label="Board"  value={student.s10_board} />
          <Field label="Year"   value={student.s10_year} />
          <Field label="Score"  value={student.s10_score} />
        </Grid>

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
          12th Details
        </Typography>
        <Grid container spacing={2}>
          <Field label="College" value={student.s12_college} />
          <Field label="Board"   value={student.s12_board} />
          <Field label="Year"    value={student.s12_year} />
          <Field label="Score"   value={student.s12_score} />
        </Grid>

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
          Diploma Details
        </Typography>
        <Grid container spacing={2}>
          <Field label="College" value={student.dip_college} />
          <Field label="Board"   value={student.dip_board} />
          <Field label="Year"    value={student.dip_year} />
          <Field label="Score"   value={student.dip_score} />
        </Grid>

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
          UG Details
        </Typography>
        <Grid container spacing={2}>
          <Field label="College" value={student.ug_college} />
          <Field label="University" value={student.ug_board} />
          <Field label="Year"    value={student.ug_year} />
          <Field label="CGPA"    value={student.ug_score} />
        </Grid>

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
          PG Details
        </Typography>
        <Grid container spacing={2}>
          <Field label="College" value={student.pg_college} />
          <Field label="University" value={student.pg_board} />
          <Field label="Year"    value={student.pg_year} />
          <Field label="CGPA"    value={student.pg_score} />
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
