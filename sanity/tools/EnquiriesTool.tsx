import { useEffect, useMemo, useState } from 'react';
import { useClient } from 'sanity';
import { IntentLink } from 'sanity/router';
import { Badge, Box, Button, Card, Flex, Grid, Select, Stack, Text, TextInput } from '@sanity/ui';
import { DownloadIcon } from '@sanity/icons/Download';
import { SearchIcon } from '@sanity/icons/Search';
import { apiVersion } from '../../lib/sanity-env';
import { STATUSES, type Status } from '../schemaTypes/enquiry';

/* "Enquiries" tool in the Studio's top bar: every contact-form lead, live,
   with counts, search, status changes in place and CSV export. */

type Enquiry = {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  concern?: string;
  message?: string;
  status?: Status;
  sourcePage?: string;
  followUpOn?: string;
  submittedAt?: string;
  _createdAt: string;
};

const QUERY = `*[_type == "enquiry" && !(_id in path("drafts.**"))] | order(coalesce(submittedAt, _createdAt) desc)[0...2000]{
  _id, name, phone, email, concern, message, status, sourcePage, followUpOn, submittedAt, _createdAt }`;

const TONE: Record<Status, 'critical' | 'caution' | 'positive' | 'default'> = {
  new: 'critical',
  contacted: 'caution',
  booked: 'positive',
  closed: 'default',
};

const when = (e: Enquiry) => new Date(e.submittedAt ?? e._createdAt);
const fmt = (d: Date) =>
  d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });
const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const label = (s: string) => s[0].toUpperCase() + s.slice(1);

function toCsv(rows: Enquiry[]) {
  const cols = ['submittedAt', 'name', 'phone', 'email', 'concern', 'message', 'status', 'followUpOn', 'sourcePage'] as const;
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(c === 'submittedAt' ? when(r).toISOString() : r[c])).join(','))].join('\n');
}

function Stat({ title, value, tone }: { title: string; value: number; tone?: 'critical' | 'positive' | 'primary' }) {
  return (
    <Card padding={4} radius={3} shadow={1} tone={tone ?? 'default'}>
      <Stack gap={3}>
        <Text size={1} muted>{title}</Text>
        <Text size={4} weight="bold">{value}</Text>
      </Stack>
    </Card>
  );
}

export function EnquiriesTool() {
  const client = useClient({ apiVersion });
  const [rows, setRows] = useState<Enquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Status | 'all' | 'followup'>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    let alive = true;
    const load = () =>
      client.fetch<Enquiry[]>(QUERY).then((r) => alive && setRows(r), (e) => alive && setError(String(e.message ?? e)));
    load();
    // Re-fetch whenever a lead arrives or someone changes one.
    const sub = client.listen('*[_type == "enquiry"]', {}, { visibility: 'query' }).subscribe(() => load());
    return () => {
      alive = false;
      sub.unsubscribe();
    };
  }, [client]);

  const stats = useMemo(() => {
    const all = rows ?? [];
    const today = startOfDay();
    const week = new Date(today.getTime() - 6 * 864e5);
    const month = new Date(today.getFullYear(), today.getMonth(), 1);
    const inMonth = all.filter((e) => when(e) >= month);
    return {
      new: all.filter((e) => (e.status ?? 'new') === 'new').length,
      today: all.filter((e) => when(e) >= today).length,
      week: all.filter((e) => when(e) >= week).length,
      month: inMonth.length,
      booked: inMonth.filter((e) => e.status === 'booked').length,
      followup: all.filter((e) => e.followUpOn && new Date(e.followUpOn) <= new Date() && e.status !== 'closed' && e.status !== 'booked').length,
    };
  }, [rows]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const now = new Date();
    return (rows ?? []).filter((e) => {
      const st = e.status ?? 'new';
      if (filter === 'followup') {
        if (!e.followUpOn || new Date(e.followUpOn) > now || st === 'closed' || st === 'booked') return false;
      } else if (filter !== 'all' && st !== filter) return false;
      if (!term) return true;
      return [e.name, e.phone, e.email, e.concern, e.message].some((v) => v?.toLowerCase().includes(term));
    });
  }, [rows, filter, q]);

  const setStatus = (id: string, status: Status) => {
    setRows((r) => r && r.map((e) => (e._id === id ? { ...e, status } : e)));
    client.patch(id).set({ status }).commit().catch((e) => setError(String(e.message ?? e)));
  };

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob(['﻿' + toCsv(shown)], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `enquiries-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box padding={[3, 4, 5]} style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Stack gap={5}>
        <Grid gridTemplateColumns={[2, 3, 6]} gap={3}>
          <Stat title="New – to call" value={stats.new} tone={stats.new ? 'critical' : undefined} />
          <Stat title="Follow-ups due" value={stats.followup} tone={stats.followup ? 'primary' : undefined} />
          <Stat title="Today" value={stats.today} />
          <Stat title="Last 7 days" value={stats.week} />
          <Stat title="This month" value={stats.month} />
          <Stat title="Booked this month" value={stats.booked} tone="positive" />
        </Grid>

        <Flex gap={2} wrap="wrap" align="center">
          {(['all', ...STATUSES, 'followup'] as const).map((s) => (
            <Button
              key={s}
              mode={filter === s ? 'default' : 'ghost'}
              tone={filter === s ? 'primary' : 'default'}
              text={s === 'followup' ? 'Follow-ups due' : label(s)}
              onClick={() => setFilter(s)}
            />
          ))}
          <Box flex={1} style={{ minWidth: 200 }}>
            <TextInput icon={SearchIcon} placeholder="Search name, phone, concern…" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
          </Box>
          <Button icon={DownloadIcon} mode="ghost" text="Export CSV" onClick={exportCsv} disabled={!shown.length} />
        </Flex>

        {error ? <Card padding={3} tone="critical" radius={2}><Text size={1}>{error}</Text></Card> : null}

        {rows === null ? (
          <Text muted>Loading…</Text>
        ) : !shown.length ? (
          <Card padding={5} radius={3} border><Text align="center" muted>No enquiries here yet.</Text></Card>
        ) : (
          <Stack gap={2}>
            {shown.map((e) => {
              const st = e.status ?? 'new';
              const digits = (e.phone ?? '').replace(/\D/g, '');
              return (
                <Card key={e._id} padding={3} radius={3} border tone={st === 'new' ? 'critical' : 'default'}>
                  <Grid gridTemplateColumns={[1, 1, 12]} gap={3}>
                    <Stack gap={2} style={{ gridColumn: 'span 3' }}>
                      <Flex gap={2} align="center">
                        <Text weight="semibold">{e.name || '(no name)'}</Text>
                        <Badge tone={TONE[st]}>{label(st)}</Badge>
                      </Flex>
                      <Text size={1} muted>{fmt(when(e))}</Text>
                    </Stack>
                    <Stack gap={2} style={{ gridColumn: 'span 3' }}>
                      {digits ? (
                        <Flex gap={3}>
                          <Text size={1}><a href={`tel:+91${digits}`}>{e.phone}</a></Text>
                          <Text size={1}><a href={`https://wa.me/91${digits}`} target="_blank" rel="noreferrer">WhatsApp</a></Text>
                        </Flex>
                      ) : null}
                      {e.email ? <Text size={1}><a href={`mailto:${e.email}`}>{e.email}</a></Text> : null}
                    </Stack>
                    <Stack gap={2} style={{ gridColumn: 'span 4' }}>
                      {e.concern ? <Text size={1} weight="medium">{e.concern}</Text> : null}
                      {e.message ? <Text size={1} muted textOverflow="ellipsis">{e.message}</Text> : null}
                      {e.sourcePage ? <Text size={0} muted textOverflow="ellipsis">from {e.sourcePage.replace(/^https?:\/\/[^/]+/, '')}</Text> : null}
                      {e.followUpOn ? <Text size={0} muted>Follow up: {new Date(e.followUpOn).toLocaleDateString('en-IN')}</Text> : null}
                    </Stack>
                    <Stack gap={2} style={{ gridColumn: 'span 2' }}>
                      <Select value={st} onChange={(ev) => setStatus(e._id, ev.currentTarget.value as Status)} fontSize={1}>
                        {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                      </Select>
                      <Text size={1}><IntentLink intent="edit" params={{ id: e._id, type: 'enquiry' }}>Notes & details →</IntentLink></Text>
                    </Stack>
                  </Grid>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
