// src/pages/StudentDetailsDialog.jsx
import React from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Grid,
  Typography,
} from '@mui/material';

/* ---------- helper: camelCase → snake_case ---------- */
const toSnake = (str) =>
  str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());

const camelToSnakeObj = (obj) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [toSnake(k), v])
  );

/* ---------- dialog component ---------- */
export default function StudentDetailsDialog({ open, onClose, onSave, student }) {
  /* ---------- form state ---------- */
  const [form, setForm] = React.useState({
    currentAddress: '',
    permanentAddress: '',
    fatherName: '',
    // 10th
    s10School: '',
    s10Board: '',
    s10Year: '',
    s10Score: '',
    // 12th (optional)
    s12College: '',
    s12Board: '',
    s12Year: '',
    s12Score: '',
    // Diploma (optional)
    dipCollege: '',
    dipBoard: '',
    dipYear: '',
    dipScore: '',
    // UG
    ugCollege: '',
    ugBoard: '',
    ugYear: '',
    ugScore: '',
    // PG (optional)
    pgCollege: '',
    pgBoard: '',
    pgYear: '',
    pgScore: '',
    bloodGroup: '',
  });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
/* -------- pre‑fill when dialog opens -------- */
React.useEffect(() => {
  if (open && student) {
    setForm({
      currentAddress: student.current_address || '',
      permanentAddress: student.permanent_address || '',
      fatherName: student.father_name || '',
      bloodGroup: student.blood_group || '',

      s10School: student.s10_school || '',
      s10Board: student.s10_board || '',
      s10Year: student.s10_year?.toString() || '',
      s10Score: student.s10_score || '',

      s12College: student.s12_college || '',
      s12Board: student.s12_board || '',
      s12Year: student.s12_year?.toString() || '',
      s12Score: student.s12_score || '',

      dipCollege: student.dip_college || '',
      dipBoard: student.dip_board || '',
      dipYear: student.dip_year?.toString() || '',
      dipScore: student.dip_score || '',

      ugCollege: student.ug_college || '',
      ugBoard: student.ug_board || '',
      ugYear: student.ug_year?.toString() || '',
      ugScore: student.ug_score || '',

      pgCollege: student.pg_college || '',
      pgBoard: student.pg_board || '',
      pgYear: student.pg_year?.toString() || '',
      pgScore: student.pg_score || '',
    });
  }
}, [open, student]);


  /* ---------- submit ---------- */
  const handleSubmit = () => {
    const required = [
      'currentAddress','permanentAddress','fatherName',
      's10School','s10Board','s10Year','s10Score',
      'ugCollege','ugBoard','ugYear','ugScore',
      'bloodGroup',
    ];
    const missing = required.filter((k) => !form[k].trim());
    if (missing.length) {
      alert('Please fill all required fields.');
      return;
    }

    const snakeForm = camelToSnakeObj(form);
    onSave({ id: student.id, ...camelToSnakeObj(form) });
    onClose();
  };

  const SectionLabel = ({ children }) => (
    <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 600 }}>
      {children}
    </Typography>
  );

  /* ---------- UI ---------- */
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Full Student Details</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Fields marked with * are mandatory.
        </DialogContentText>

        {/* Basic identity (read‑only) */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField label="Full Name *" value={student.name} fullWidth disabled />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Phone Number *" value={student.phone} fullWidth disabled />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Email *" value={student.email} fullWidth disabled />
          </Grid>
        </Grid>

        {/* Address */}
        <SectionLabel>Address</SectionLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Current Address *"
              value={form.currentAddress}
              onChange={handleChange('currentAddress')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Permanent Address *"
              value={form.permanentAddress}
              onChange={handleChange('permanentAddress')}
              fullWidth
            />
          </Grid>
        </Grid>

        {/* Personal */}
        <SectionLabel>Personal</SectionLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Father's Name *"
              value={form.fatherName}
              onChange={handleChange('fatherName')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Blood Group *"
              value={form.bloodGroup}
              onChange={handleChange('bloodGroup')}
              fullWidth
            />
          </Grid>
        </Grid>

        {/* 10th */}
        <SectionLabel>10th Details</SectionLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="School Name *"
              value={form.s10School}
              onChange={handleChange('s10School')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Board *"
              value={form.s10Board}
              onChange={handleChange('s10Board')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              label="Year of Pass *"
              value={form.s10Year}
              onChange={handleChange('s10Year')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              label="Percentage / CGPA *"
              value={form.s10Score}
              onChange={handleChange('s10Score')}
              fullWidth
            />
          </Grid>
        </Grid>

        {/* 12th (optional) */}
        <SectionLabel>12th Details (optional)</SectionLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="College Name"
              value={form.s12College}
              onChange={handleChange('s12College')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Board"
              value={form.s12Board}
              onChange={handleChange('s12Board')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              label="Year of Pass"
              value={form.s12Year}
              onChange={handleChange('s12Year')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              label="Percentage / CGPA"
              value={form.s12Score}
              onChange={handleChange('s12Score')}
              fullWidth
            />
          </Grid>
        </Grid>

        {/* Diploma (optional) */}
        <SectionLabel>Diploma Details (optional)</SectionLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="College Name"
              value={form.dipCollege}
              onChange={handleChange('dipCollege')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Board"
              value={form.dipBoard}
              onChange={handleChange('dipBoard')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              label="Year of Pass"
              value={form.dipYear}
              onChange={handleChange('dipYear')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              label="Percentage / CGPA"
              value={form.dipScore}
              onChange={handleChange('dipScore')}
              fullWidth
            />
          </Grid>
        </Grid>

        {/* UG */}
        <SectionLabel>Under‑Graduation Details</SectionLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="College Name *"
              value={form.ugCollege}
              onChange={handleChange('ugCollege')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="University *"
              value={form.ugBoard}
              onChange={handleChange('ugBoard')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              label="Year of Pass *"
              value={form.ugYear}
              onChange={handleChange('ugYear')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              label="CGPA *"
              value={form.ugScore}
              onChange={handleChange('ugScore')}
              fullWidth
            />
          </Grid>
        </Grid>

        {/* PG (optional) */}
        <SectionLabel>Post‑Graduation Details (optional)</SectionLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="College Name"
              value={form.pgCollege}
              onChange={handleChange('pgCollege')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="University"
              value={form.pgBoard}
              onChange={handleChange('pgBoard')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              label="Year of Pass"
              value={form.pgYear}
              onChange={handleChange('pgYear')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              label="CGPA"
              value={form.pgScore}
              onChange={handleChange('pgScore')}
              fullWidth
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ pr: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
