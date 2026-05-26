import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Field Definitions (from ticket.json ticketSchema) ────────────────────────

export interface AggregatorField {
  key: string;
  label: string;
  type: "currency" | "string" | "date" | "datetime" | "boolean" | "demerit";
}

/** Fields coinciding with Jamaica ticket.json ticketSchema – for lookup results */
export const JAMAICA_TICKET_FIELDS: AggregatorField[] = [
  { key: "fineAmount", label: "Fine", type: "currency" },
  { key: "workflowState", label: "Status", type: "string" },
  { key: "offenceDesc", label: "Offence", type: "string" },
  { key: "offenceCode", label: "Offence Code", type: "string" },
  { key: "issueDate", label: "Issue Date", type: "date" },
  { key: "paymentDueDate", label: "Payment Due", type: "datetime" },
  { key: "courtDate", label: "Court Date", type: "date" },
  { key: "courtLocation", label: "Court Location", type: "string" },
  { key: "demeritPoints", label: "Demerit Points", type: "demerit" },
  { key: "mandatoryCourtApp", label: "Court Required", type: "boolean" },
];

/** Fields mapped from ticket.json storeMapping – for saved Ticket records */
export const SAVED_TICKET_FIELDS: AggregatorField[] = [
  { key: "amount", label: "Fine", type: "currency" },
  { key: "status", label: "Status", type: "string" },
  { key: "violation", label: "Offence", type: "string" },
  { key: "date", label: "Issue Date", type: "date" },
  { key: "dueDate", label: "Payment Due", type: "date" },
  { key: "demeritPoints", label: "Demerit Points", type: "demerit" },
  { key: "issuingAuthority", label: "Issuing Authority", type: "string" },
  { key: "region", label: "Region", type: "string" },
];

// ─── Aggregation Logic ────────────────────────────────────────────────────────

type AggResult =
  | { type: "currency"; total: number; avg: number; count: number }
  | { type: "demerit"; total: number; avg: number; count: number }
  | { type: "boolean"; trueCount: number; falseCount: number; total: number }
  | { type: "string"; groups: [string, number][]; total: number }
  | { type: "date"; groups: [string, number][]; max: number; total: number };

function aggregate<T>(
  items: T[],
  field: AggregatorField,
  getFieldValue: (item: T, key: string) => unknown,
): AggResult | null {
  const values = items.map((item) => getFieldValue(item, field.key));

  if (field.type === "currency") {
    const nums = values
      .map((v) => parseFloat(String(v ?? "0").replace(/[^0-9.]/g, "")))
      .filter((n) => !isNaN(n));
    if (nums.length === 0) return null;
    const total = nums.reduce((s, n) => s + n, 0);
    return {
      type: "currency",
      total,
      avg: total / nums.length,
      count: nums.length,
    };
  }

  if (field.type === "demerit") {
    const nums = values
      .map((v) => parseFloat(String(v ?? "0")))
      .filter((n) => !isNaN(n) && n > 0);
    if (nums.length === 0) return null;
    const total = nums.reduce((s, n) => s + n, 0);
    return {
      type: "demerit",
      total,
      avg: total / nums.length,
      count: nums.length,
    };
  }

  if (field.type === "boolean") {
    const trueCount = values.filter(
      (v) => v === "true" || v === true || v === "Yes",
    ).length;
    const falseCount = items.length - trueCount;
    return { type: "boolean", trueCount, falseCount, total: items.length };
  }

  if (field.type === "date" || field.type === "datetime") {
    const byMonth: Record<string, number> = {};
    values.forEach((v) => {
      if (!v) return;
      const d = new Date((v as string).split(" ")[0]);
      if (!isNaN(d.getTime())) {
        const key = d.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
        });
        byMonth[key] = (byMonth[key] ?? 0) + 1;
      }
    });
    const groups = Object.entries(byMonth).sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime(),
    ) as [string, number][];
    const max = groups.reduce((m, [, c]) => Math.max(m, c), 0);
    return { type: "date", groups, max, total: items.length };
  }

  // string
  const counts: Record<string, number> = {};
  values.forEach((v) => {
    const key = String(v ?? "—").trim() || "—";
    counts[key] = (counts[key] ?? 0) + 1;
  });
  const groups = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7) as [string, number][];
  return { type: "string", groups, total: items.length };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TicketAggregatorProps<T> {
  items: T[];
  fields: AggregatorField[];
  getFieldValue: (item: T, key: string) => unknown;
  getDateValue: (item: T) => string | null | undefined;
}

export function TicketAggregator<T>({
  items,
  fields,
  getFieldValue,
  getDateValue,
}: TicketAggregatorProps<T>) {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  const [expanded, setExpanded] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedKey, setSelectedKey] = useState(fields[0]?.key ?? "");

  const field = fields.find((f) => f.key === selectedKey) ?? fields[0];

  const filteredItems = useMemo(() => {
    if (!fromDate && !toDate) return items;
    return items.filter((item) => {
      const raw = getDateValue(item);
      if (!raw) return true;
      const d = new Date(raw.split(" ")[0]);
      if (isNaN(d.getTime())) return true;
      if (fromDate) {
        const from = new Date(fromDate);
        if (!isNaN(from.getTime()) && d < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        if (!isNaN(to.getTime()) && d > to) return false;
      }
      return true;
    });
  }, [items, fromDate, toDate, getDateValue]);

  const result = useMemo(() => {
    if (!field || filteredItems.length === 0) return null;
    return aggregate(filteredItems, field, getFieldValue);
  }, [filteredItems, field, getFieldValue]);

  if (!expanded) {
    return (
      <TouchableOpacity
        style={[
          styles.collapsed,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
        onPress={() => setExpanded(true)}
        activeOpacity={0.8}
      >
        <IconSymbol name="chart.bar.fill" size={15} color={c.tint} />
        <Text style={[styles.collapsedText, { color: c.text }]}>
          Insights &amp; Aggregation
        </Text>
        <IconSymbol name="chevron.down" size={13} color={c.subtext} />
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      {/* Header */}
      <TouchableOpacity
        style={styles.expandedHeader}
        onPress={() => setExpanded(false)}
        activeOpacity={0.8}
      >
        <IconSymbol name="chart.bar.fill" size={15} color={c.tint} />
        <Text style={[styles.collapsedText, { color: c.text }]}>
          Insights &amp; Aggregation
        </Text>
        <IconSymbol name="chevron.up" size={13} color={c.subtext} />
      </TouchableOpacity>

      {/* Date Range */}
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={[styles.dateLabel, { color: c.subtext }]}>From</Text>
          <TextInput
            style={[
              styles.dateInput,
              {
                backgroundColor: c.background,
                borderColor: c.border,
                color: c.text,
              },
            ]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={c.subtext}
            value={fromDate}
            onChangeText={setFromDate}
            keyboardType="numbers-and-punctuation"
            autoCorrect={false}
          />
        </View>
        <View style={styles.dateField}>
          <Text style={[styles.dateLabel, { color: c.subtext }]}>To</Text>
          <TextInput
            style={[
              styles.dateInput,
              {
                backgroundColor: c.background,
                borderColor: c.border,
                color: c.text,
              },
            ]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={c.subtext}
            value={toDate}
            onChangeText={setToDate}
            keyboardType="numbers-and-punctuation"
            autoCorrect={false}
          />
        </View>
        {fromDate || toDate ? (
          <TouchableOpacity
            style={[
              styles.clearBtn,
              { backgroundColor: c.background, borderColor: c.border },
            ]}
            onPress={() => {
              setFromDate("");
              setToDate("");
            }}
          >
            <IconSymbol name="xmark" size={12} color={c.subtext} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={[styles.rangeCount, { color: c.subtext }]}>
        {filteredItems.length} of {items.length} ticket
        {items.length !== 1 ? "s" : ""} in range
      </Text>

      {/* Field Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContainer}
      >
        {fields.map((f) => {
          const active = f.key === selectedKey;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? c.tint : c.background,
                  borderColor: active ? c.tint : c.border,
                },
              ]}
              onPress={() => setSelectedKey(f.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? "#fff" : c.subtext },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Result */}
      {result ? (
        <View
          style={[
            styles.result,
            { backgroundColor: c.background, borderColor: c.border },
          ]}
        >
          {result.type === "currency" && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: c.text }]}>
                  $
                  {result.total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <Text style={[styles.statLabel, { color: c.subtext }]}>
                  Total
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: c.border }]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: c.text }]}>
                  $
                  {result.avg.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <Text style={[styles.statLabel, { color: c.subtext }]}>
                  Average
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: c.border }]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: c.text }]}>
                  {result.count}
                </Text>
                <Text style={[styles.statLabel, { color: c.subtext }]}>
                  Count
                </Text>
              </View>
            </View>
          )}

          {result.type === "demerit" && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: c.text }]}>
                  {result.total}
                </Text>
                <Text style={[styles.statLabel, { color: c.subtext }]}>
                  Total pts
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: c.border }]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: c.text }]}>
                  {result.avg.toFixed(1)}
                </Text>
                <Text style={[styles.statLabel, { color: c.subtext }]}>
                  Avg pts
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: c.border }]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: c.text }]}>
                  {result.count}
                </Text>
                <Text style={[styles.statLabel, { color: c.subtext }]}>
                  Tickets
                </Text>
              </View>
            </View>
          )}

          {result.type === "boolean" && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: StatusColors.danger }]}
                >
                  {result.trueCount}
                </Text>
                <Text style={[styles.statLabel, { color: c.subtext }]}>
                  Required
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: c.border }]}
              />
              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: StatusColors.success }]}
                >
                  {result.falseCount}
                </Text>
                <Text style={[styles.statLabel, { color: c.subtext }]}>
                  Not Required
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: c.border }]}
              />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: c.text }]}>
                  {result.total}
                </Text>
                <Text style={[styles.statLabel, { color: c.subtext }]}>
                  Total
                </Text>
              </View>
            </View>
          )}

          {(result.type === "string" || result.type === "date") &&
            result.groups.length > 0 && (
              <View style={styles.groupsContainer}>
                {result.groups.map(([label, count]) => {
                  const barMax =
                    result.type === "date"
                      ? (result as { max: number }).max
                      : result.groups[0][1];
                  const barPct = barMax > 0 ? (count / barMax) * 100 : 0;
                  return (
                    <View key={label} style={styles.groupRow}>
                      <Text
                        style={[styles.groupLabel, { color: c.text }]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                      <View
                        style={[
                          styles.groupBarTrack,
                          { backgroundColor: c.border },
                        ]}
                      >
                        <View
                          style={[
                            styles.groupBarFill,
                            { backgroundColor: c.tint, width: `${barPct}%` },
                          ]}
                        />
                      </View>
                      <Text style={[styles.groupCount, { color: c.subtext }]}>
                        {count}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
        </View>
      ) : (
        <Text style={[styles.emptyAgg, { color: c.subtext }]}>
          {filteredItems.length === 0
            ? "No tickets in selected date range"
            : "No data for selected field"}
        </Text>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  collapsed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    // marginHorizontal: 16,
    // marginBottom: 10,
  },
  collapsedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  container: {
    borderRadius: 14,
    borderWidth: 1,
    // marginHorizontal: 16,
    marginBottom: 10,
    overflow: "hidden",
  },
  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  dateField: {
    flex: 1,
    gap: 4,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  rangeCount: {
    fontSize: 11,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipContainer: {
    paddingHorizontal: 14,
    gap: 6,
    paddingBottom: 10,
    flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  result: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    marginHorizontal: 8,
  },
  groupsContainer: {
    gap: 8,
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  groupLabel: {
    width: 90,
    fontSize: 12,
    fontWeight: "500",
  },
  groupBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  groupBarFill: {
    height: 6,
    borderRadius: 3,
  },
  groupCount: {
    width: 28,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  emptyAgg: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});
