import React, { useMemo } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MantraRecitation, MantraStats, DailyStats } from '../types';
import dayjs from 'dayjs';

interface MetricsDashboardProps {
  recitations: MantraRecitation[];
}

const COLORS = ['#6b46c1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function MetricsDashboard({ recitations }: MetricsDashboardProps) {
  const stats: MantraStats = useMemo(() => {
    if (recitations.length === 0) {
      return {
        totalRecitations: 0,
        totalCount: 0,
        totalDuration: 0,
        averageCount: 0,
        averageDuration: 0,
        mostRecitedMantra: '',
      };
    }

    const totalRecitations = recitations.length;
    const totalCount = recitations.reduce((sum, r) => sum + r.count, 0);
    const totalDuration = recitations.reduce((sum, r) => sum + r.duration, 0);
    
    const mantraCounts = recitations.reduce((acc, r) => {
      acc[r.mantraName] = (acc[r.mantraName] || 0) + r.count;
      return acc;
    }, {} as Record<string, number>);
    
    const mostRecitedMantra = Object.entries(mantraCounts).reduce(
      (max, [mantra, count]) => count > max.count ? { mantra, count } : max,
      { mantra: '', count: 0 }
    ).mantra;

    return {
      totalRecitations,
      totalCount,
      totalDuration,
      averageCount: Math.round(totalCount / totalRecitations),
      averageDuration: Math.round(totalDuration / totalRecitations),
      mostRecitedMantra,
    };
  }, [recitations]);

  const dailyStats: DailyStats[] = useMemo(() => {
    const dailyData = recitations.reduce((acc, r) => {
      const date = dayjs(r.timestamp).format('YYYY-MM-DD');
      if (!acc[date]) {
        acc[date] = { date, count: 0, duration: 0, recitations: 0 };
      }
      acc[date].count += r.count;
      acc[date].duration += r.duration;
      acc[date].recitations += 1;
      return acc;
    }, {} as Record<string, DailyStats>);

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }, [recitations]);

  const mantraDistribution = useMemo(() => {
    const distribution = recitations.reduce((acc, r) => {
      acc[r.mantraName] = (acc[r.mantraName] || 0) + r.count;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([name, count]) => ({
      name,
      count,
    }));
  }, [recitations]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Recitations
            </Typography>
            <Typography variant="h4">
              {stats.totalRecitations}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Count
            </Typography>
            <Typography variant="h4">
              {stats.totalCount.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Duration
            </Typography>
            <Typography variant="h4">
              {Math.round(stats.totalDuration / 60)}h {stats.totalDuration % 60}m
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Most Recited
            </Typography>
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
              {stats.mostRecitedMantra || 'N/A'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Daily Progress
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#6b46c1" name="Count" />
                <Line type="monotone" dataKey="duration" stroke="#ec4899" name="Duration (min)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Mantra Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mantraDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {mantraDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Recitations
            </Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {recitations
                .slice()
                .reverse()
                .slice(0, 10)
                .map((recitation) => (
                  <Box
                    key={recitation.id}
                    sx={{
                      p: 2,
                      borderBottom: '1px solid #eee',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Typography variant="subtitle1">
                      {recitation.mantraName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {recitation.count} repetitions • {recitation.duration} minutes • {' '}
                      {dayjs(recitation.timestamp).format('MMM D, YYYY h:mm A')}
                    </Typography>
                    {recitation.notes && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        {recitation.notes}
                      </Typography>
                    )}
                  </Box>
                ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}