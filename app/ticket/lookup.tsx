import {
  JAMAICA_TICKET_FIELDS,
  TicketAggregator,
} from "@/components/tickets/ticket-aggregator";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StatusBadge } from "@/components/ui/status-badge";
import { Colors, StatusColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  hasLicenseCoverage,
  JamaicaTicket,
  mapLicenseToInput,
  mapToTicket,
  performJamaicaLookup,
  ticketSpec,
} from "@/services/ticket-lookup/jamaica-lookup";
import { TicketLookupProvider } from "@/services/ticket-lookup/provider";
import { getProvidersByRegion } from "@/services/ticket-lookup/registry";
import { useLicenseStore, useSettingsStore, useTicketsStore } from "@/store";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScreenView = "list" | "web" | "form" | "results";

interface LookupInput {
  driversLicNo: string;
  controlNo: string;
  origLicIssueDate: string;
  dateOfBirth: string;
}

type FilterTab = "all" | "unpaid";
type InputMode = "license" | "manual";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw.split(" ")[0]);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function workflowToStatus(
  state: string,
): "danger" | "success" | "warning" | "neutral" {
  const s = state?.toLowerCase() ?? "";
  if (s === "paid") return "success";
  if (s === "dismissed" || s === "withdrawn") return "neutral";
  if (s === "disputed") return "warning";
  return "danger";
}

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(new Date(value).getTime());
}

/**
 * Applies normalizeToIsoDate to any input field whose spec type is "date".
 * This converts whatever format the licence stores into YYYY-MM-DD.
 */
function normalizeMappedDates(raw: Partial<LookupInput>): LookupInput {
  const result: LookupInput = {
    driversLicNo: "",
    controlNo: "",
    origLicIssueDate: "",
    dateOfBirth: "",
    ...raw,
  };
  for (const field of ticketSpec.inputFields) {
    if (field.type === "date") {
      const key = field.id as keyof LookupInput;
      result[key] = normalizeToIsoDate(result[key] ?? "");
    }
  }
  return result;
}
/**
 * Attempts to coerce various date formats to YYYY-MM-DD.
 * Handles: DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD, YYYY-MM-DD, and JS-parseable strings.
 */
function normalizeToIsoDate(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // YYYY/MM/DD or YYYY.MM.DD
  const ymd = trimmed.match(/^(\d{4})[/\.](\d{1,2})[/\.](\d{1,2})$/);
  if (ymd)
    return `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = trimmed.match(/^(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})$/);
  if (dmy)
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  // Epoch ms string (e.g. from API)
  if (/^\d{10,13}$/.test(trimmed)) {
    const ms = parseInt(trimmed, 10);
    const d = new Date(trimmed.length === 10 ? ms * 1000 : ms);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  }
  return trimmed;
}

// ─── Ticket Result Card ───────────────────────────────────────────────────────

interface TicketResultCardProps {
  ticket: JamaicaTicket;
  saved: boolean;
  onSave: () => void;
  c: (typeof Colors)["light"];
}

function TicketResultCard({ ticket, saved, onSave, c }: TicketResultCardProps) {
  const badgeStatus = workflowToStatus(ticket.workflowState);
  return (
    <Card style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={[styles.ticketNo, { color: c.subtext }]}>
          #{ticket.ticketNo}
        </Text>
        <StatusBadge label={ticket.workflowState} status={badgeStatus} />
      </View>

      <Text style={[styles.offence, { color: c.text }]}>
        {ticket.offenceDesc}
      </Text>

      <View style={styles.resultMeta}>
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, { color: c.subtext }]}>Fine</Text>
          <Text style={[styles.metaValue, { color: c.text }]}>
            {(() => {
              const n = parseFloat(ticket.fineAmount);
              return isNaN(n)
                ? ticket.fineAmount || "—"
                : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JMD`;
            })()}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, { color: c.subtext }]}>Issued</Text>
          <Text style={[styles.metaValue, { color: c.text }]}>
            {formatDate(ticket.issueDate)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={[styles.metaLabel, { color: c.subtext }]}>
            Due / Court
          </Text>
          <Text style={[styles.metaValue, { color: c.text }]}>
            {formatDate(ticket.paymentDueDate || ticket.courtDate)}
          </Text>
        </View>
        {ticket.demeritPoints ? (
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: c.subtext }]}>
              Demerit pts
            </Text>
            <Text style={[styles.metaValue, { color: c.text }]}>
              {ticket.demeritPoints}
            </Text>
          </View>
        ) : null}
      </View>

      {ticket.courtLocation ? (
        <Text style={[styles.courtInfo, { color: c.subtext }]}>
          Court: {ticket.courtLocation}
          {ticket.mandatoryCourtApp === "true" ? " (attendance required)" : ""}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.saveBtn,
          {
            backgroundColor: saved ? c.card : c.tint,
            borderColor: saved ? c.border : c.tint,
          },
        ]}
        onPress={onSave}
        disabled={saved}
      >
        <IconSymbol
          name={saved ? "checkmark.circle.fill" : "square.and.arrow.down"}
          size={15}
          color={saved ? StatusColors.success : "#fff"}
        />
        <Text
          style={[
            styles.saveBtnText,
            { color: saved ? StatusColors.success : "#fff" },
          ]}
        >
          {saved ? "Saved" : "Save to Records"}
        </Text>
      </TouchableOpacity>
    </Card>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TicketLookupScreen() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];
  const country = useSettingsStore((s) => s.country);
  const addTickets = useTicketsStore((s) => s.addTickets);
  const hasTicket = useTicketsStore((s) => s.hasTicket);
  const license = useLicenseStore((s) => s.license);
  const allTicketsInStore = useTicketsStore((s) => s.tickets);

  const providers = getProvidersByRegion(country);

  const [currentView, setCurrentView] = useState<ScreenView>("list");
  const [selectedProvider, setSelectedProvider] =
    useState<TicketLookupProvider | null>(null);

  const [inputMode, setInputMode] = useState<InputMode>("license");
  const [input, setInput] = useState<LookupInput>({
    driversLicNo: "",
    controlNo: "",
    origLicIssueDate: "",
    dateOfBirth: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allTickets, setAllTickets] = useState<JamaicaTicket[]>([]);
  const [unpaidTickets, setUnpaidTickets] = useState<JamaicaTicket[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Auto-skip to form view when there's only one provider
  useEffect(() => {
    if (currentView === "list" && providers.length === 1) {
      selectProvider(providers[0]);
    }
  }, [currentView, providers]);

  // Auto-populate fields from license when form view is entered
  useEffect(() => {
    if (currentView === "form" && license) {
      console.log("Auto-populating form with license data:", license.fields);

      if (hasLicenseCoverage(license.fields)) {
        setInput(normalizeMappedDates(mapLicenseToInput(license.fields)));
        setInputMode("license");
      } else {
        setInputMode("manual");
      }
    } else if (currentView === "form" && !license) {
      setInputMode("manual");
    }
  }, [currentView, license]);

  function goBack() {
    if (currentView === "results") {
      setCurrentView("form");
    } else if (currentView === "form" && providers.length === 1) {
      // If there's only one provider, go back to previous screen instead of showing provider list
      router.back();
    } else {
      setCurrentView("list");
      setSelectedProvider(null);
      setError(null);
    }
  }

  function selectProvider(p: TicketLookupProvider) {
    setSelectedProvider(p);
    setCurrentView(p.apiLookup ? "form" : "web");
  }

  function switchToManualMode() {
    setInputMode("manual");
    setInput({
      driversLicNo: "",
      controlNo: "",
      origLicIssueDate: "",
      dateOfBirth: "",
    });
    setError(null);
  }

  function switchToLicenseMode() {
    if (!license) return;
    setInputMode("license");
    setInput(normalizeMappedDates(mapLicenseToInput(license.fields)));
    setError(null);
  }

  function updateField(field: keyof LookupInput, value: string) {
    setInput((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }

  async function handleLookup() {
    const { driversLicNo, controlNo, origLicIssueDate, dateOfBirth } = input;
    // if (!driversLicNo || !controlNo || !origLicIssueDate || !dateOfBirth) {
    //   setError("All fields are required.");
    //   return;
    // }
    // if (!isValidIsoDate(origLicIssueDate)) {
    //   setError(
    //     inputMode === "license"
    //       ? `Your saved licence contains an unrecognised issue date ("${origLicIssueDate}"). Switch to manual entry to enter it as YYYY-MM-DD.`
    //       : `Invalid Original Licence Issue Date. Please use YYYY-MM-DD format (e.g. 2014-01-09).`,
    //   );
    //   return;
    // }
    // if (!isValidIsoDate(dateOfBirth)) {
    //   setError(
    //     inputMode === "license"
    //       ? `Your saved licence contains an unrecognised date of birth ("${dateOfBirth}"). Switch to manual entry to enter it as YYYY-MM-DD.`
    //       : `Invalid Date of Birth. Please use YYYY-MM-DD format (e.g. 1989-08-09).`,
    //   );
    //   return;
    // }
    setLoading(true);
    setError(null);
    try {
      const { all, unpaid } = await performJamaicaLookup(input);
      setAllTickets(all);
      setUnpaidTickets(unpaid);
      setActiveFilter("all");
      setCurrentView("results");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      // Strip internal prefixes so the raw API message is surfaced directly
      setError(
        msg.replace(
          /^(Licence validation failed|Failed to fetch (?:un)?paid? tickets): /i,
          "",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSaveTicket(jt: JamaicaTicket) {
    addTickets([mapToTicket(jt)]);
  }

  function handleSaveAll() {
    const displayed = activeFilter === "all" ? allTickets : unpaidTickets;
    addTickets(displayed.map(mapToTicket));
    Alert.alert(
      "Saved",
      `${displayed.length} ticket${displayed.length !== 1 ? "s" : ""} saved to your records.`,
    );
  }

  // ── Web view ──
  if (currentView === "web" && selectedProvider?.lookupUrl) {
    const url = selectedProvider.lookupUrl();
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.background }]}
      >
        <View
          style={[
            styles.topBar,
            { backgroundColor: c.card, borderBottomColor: c.border },
          ]}
        >
          <TouchableOpacity onPress={goBack}>
            <IconSymbol name="xmark" size={20} color={c.tint} />
          </TouchableOpacity>
          <Text
            style={[styles.topBarTitle, { color: c.text }]}
            numberOfLines={1}
          >
            {selectedProvider.displayName}
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(url)}>
            <IconSymbol name="square.and.arrow.up" size={20} color={c.tint} />
          </TouchableOpacity>
        </View>
        <WebView source={{ uri: url }} style={styles.webview} />
      </SafeAreaView>
    );
  }

  // ── API form view ──
  if (currentView === "form") {
    const fields = ticketSpec.inputFields;
    const inputStyle = [
      styles.input,
      { backgroundColor: c.card, borderColor: c.border, color: c.text },
    ];
    const hasLicense = !!license && hasLicenseCoverage(license.fields);

    // Calculate saved tickets stats
    const paidCount = allTicketsInStore.filter(
      (t) => t.status === "paid",
    ).length;
    const unpaidCount = allTicketsInStore.filter(
      (t) => t.status === "unpaid",
    ).length;
    const totalSavedTickets = allTicketsInStore.length;

    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.background }]}
      >
        <View
          style={[
            styles.topBar,
            { backgroundColor: c.card, borderBottomColor: c.border },
          ]}
        >
          <TouchableOpacity onPress={goBack}>
            <IconSymbol name="xmark" size={20} color={c.tint} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <View style={{ width: 20 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.formIntro, { color: c.subtext }]}>
              {inputMode === "license"
                ? "Using your saved driver's licence to look up traffic tickets on the official Jamaica government portal."
                : "Enter your driver's licence details to look up traffic tickets on the official Jamaica government portal."}
            </Text>

            {/* View Saved Tickets Button */}
            {totalSavedTickets > 0 && (
              <TouchableOpacity
                style={[
                  styles.savedTicketsBtn,
                  {
                    backgroundColor: c.card,
                    borderColor: c.border,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  },
                ]}
                onPress={() => router.push("/(tabs)/tickets")}
                activeOpacity={0.7}
              >
                <View style={styles.savedTicketsContent}>
                  <View style={styles.savedTicketsHeader}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: c.tint + "15" },
                      ]}
                    >
                      <IconSymbol
                        name="doc.text.fill"
                        size={18}
                        color={c.tint}
                      />
                    </View>
                    <View style={styles.savedTicketsTextContainer}>
                      <Text
                        style={[styles.savedTicketsTitle, { color: c.text }]}
                      >
                        Your Saved Tickets
                      </Text>
                      <Text
                        style={[
                          styles.savedTicketsSubtitle,
                          { color: c.subtext },
                        ]}
                      >
                        {totalSavedTickets} ticket
                        {totalSavedTickets !== 1 ? "s" : ""} on record
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color={c.icon} />
                  </View>
                  <View style={styles.savedTicketsCounts}>
                    <View
                      style={[
                        styles.countBadge,
                        {
                          backgroundColor:
                            unpaidCount > 0
                              ? StatusColors.dangerBg
                              : c.background,
                          borderColor:
                            unpaidCount > 0
                              ? StatusColors.danger + "30"
                              : c.border,
                        },
                      ]}
                    >
                      <View style={styles.countContent}>
                        <Text
                          style={[
                            styles.countValue,
                            {
                              color:
                                unpaidCount > 0 ? StatusColors.danger : c.text,
                            },
                          ]}
                        >
                          {unpaidCount}
                        </Text>
                        <Text style={[styles.countLabel, { color: c.subtext }]}>
                          Unpaid
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.countBadge,
                        {
                          backgroundColor:
                            paidCount > 0
                              ? StatusColors.successBg
                              : c.background,
                          borderColor:
                            paidCount > 0
                              ? StatusColors.success + "30"
                              : c.border,
                        },
                      ]}
                    >
                      <View style={styles.countContent}>
                        <Text
                          style={[
                            styles.countValue,
                            {
                              color:
                                paidCount > 0 ? StatusColors.success : c.text,
                            },
                          ]}
                        >
                          {paidCount}
                        </Text>
                        <Text style={[styles.countLabel, { color: c.subtext }]}>
                          Paid
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {inputMode === "license" && hasLicense ? (
              <View
                style={[
                  styles.licenseInfoCard,
                  {
                    backgroundColor: StatusColors.infoBg,
                    borderColor: StatusColors.info,
                  },
                ]}
              >
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={20}
                  color={StatusColors.info}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.licenseInfoTitle,
                      { color: StatusColors.info },
                    ]}
                  >
                    Using Driver's Licence #{license?.fields.licenseNumber}
                  </Text>
                  <Text
                    style={[
                      styles.licenseInfoText,
                      { color: StatusColors.info },
                    ]}
                  >
                    We'll use your saved licence information for the lookup.
                  </Text>
                </View>
              </View>
            ) : null}

            {hasLicense && (
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    inputMode === "license" && { backgroundColor: c.tint },
                    inputMode !== "license" && {
                      backgroundColor: c.card,
                      borderColor: c.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={switchToLicenseMode}
                >
                  <IconSymbol
                    name="person.text.rectangle"
                    size={14}
                    color={inputMode === "license" ? "#fff" : c.subtext}
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      { color: inputMode === "license" ? "#fff" : c.subtext },
                    ]}
                  >
                    Use Licence
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    inputMode === "manual" && { backgroundColor: c.tint },
                    inputMode !== "manual" && {
                      backgroundColor: c.card,
                      borderColor: c.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={switchToManualMode}
                >
                  <IconSymbol
                    name="keyboard"
                    size={14}
                    color={inputMode === "manual" ? "#fff" : c.subtext}
                  />
                  <Text
                    style={[
                      styles.modeButtonText,
                      { color: inputMode === "manual" ? "#fff" : c.subtext },
                    ]}
                  >
                    Enter Manually
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!hasLicense && inputMode === "license" && (
              <View
                style={[
                  styles.noLicenseCard,
                  {
                    backgroundColor: StatusColors.warningBg,
                    borderColor: StatusColors.warning,
                  },
                ]}
              >
                <IconSymbol
                  name="exclamationmark.triangle"
                  size={20}
                  color={StatusColors.warning}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.noLicenseTitle,
                      { color: StatusColors.warning },
                    ]}
                  >
                    No Driver's Licence Found
                  </Text>
                  <Text
                    style={[
                      styles.noLicenseText,
                      { color: StatusColors.warning },
                    ]}
                  >
                    Add your driver's licence in the app to use this feature, or
                    enter your details manually below.
                  </Text>
                </View>
              </View>
            )}

            {(inputMode === "manual" || !hasLicense) &&
              fields.map((field) => (
                <View key={field.id}>
                  <Text style={[styles.label, { color: c.subtext }]}>
                    {field.label}
                    {field.required ? (
                      <Text style={{ color: StatusColors.danger }}> *</Text>
                    ) : null}
                  </Text>
                  <TextInput
                    style={inputStyle}
                    placeholder={
                      "placeholder" in field
                        ? (field.placeholder as string)
                        : (field as { label: string }).label
                    }
                    placeholderTextColor={c.subtext}
                    value={input[field.id as keyof LookupInput]}
                    onChangeText={(v) =>
                      updateField(field.id as keyof LookupInput, v)
                    }
                    keyboardType={
                      "keyboardType" in field &&
                      field.keyboardType === "numeric"
                        ? "numeric"
                        : "default"
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {"hint" in field && field.hint ? (
                    <Text style={[styles.hint, { color: c.subtext }]}>
                      {field.hint as string}
                    </Text>
                  ) : null}
                </View>
              ))}

            {inputMode === "license" && hasLicense && (
              <View
                style={[
                  styles.autoFilledCard,
                  {
                    backgroundColor: c.card,
                    borderColor: c.border,
                  },
                ]}
              >
                <View style={styles.autoFilledRow}>
                  <IconSymbol
                    name="checkmark.shield.fill"
                    size={16}
                    color={StatusColors.success}
                  />
                  <Text style={[styles.autoFilledText, { color: c.subtext }]}>
                    Your licence information will be used automatically
                  </Text>
                </View>
              </View>
            )}

            {error ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: StatusColors.dangerBg },
                ]}
              >
                <IconSymbol
                  name="exclamationmark.triangle"
                  size={16}
                  color={StatusColors.danger}
                />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text
                    style={[styles.errorText, { color: StatusColors.danger }]}
                  >
                    {error}
                  </Text>
                  {inputMode === "license" && hasLicense ? (
                    <TouchableOpacity onPress={switchToManualMode}>
                      <Text
                        style={[
                          styles.errorLink,
                          { color: StatusColors.danger },
                        ]}
                      >
                        Switch to Manual Entry →
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.lookupBtn,
                { backgroundColor: loading ? c.border : c.tint },
              ]}
              onPress={handleLookup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <IconSymbol name="magnifyingglass" size={16} color="#fff" />
                  <Text style={styles.lookupBtnText}>Look Up Tickets</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Results view ──
  if (currentView === "results") {
    const displayed = activeFilter === "all" ? allTickets : unpaidTickets;
    const allSaved =
      displayed.length > 0 &&
      displayed.every((t) => hasTicket(`jm-${t.ticketNo}`));

    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.background }]}
      >
        {/* Back bar */}
        <View
          style={[
            styles.topBar,
            { backgroundColor: c.card, borderBottomColor: c.border },
          ]}
        >
          <TouchableOpacity onPress={goBack}>
            <IconSymbol name="xmark" size={20} color={c.tint} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: c.text }]}>
            Tickets Results
          </Text>
          <View style={{ width: 20 }} />
        </View>

        <View
          style={[
            styles.tabRow,
            { backgroundColor: c.card, borderBottomColor: c.border },
          ]}
        >
          {(["all", "unpaid"] as FilterTab[]).map((tab) => {
            const count =
              tab === "all" ? allTickets.length : unpaidTickets.length;
            const active = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  active && {
                    borderBottomColor: c.tint,
                    borderBottomWidth: 2,
                  },
                ]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? c.tint : c.subtext },
                  ]}
                >
                  {tab === "all" ? "All" : "Unpaid"}{" "}
                  <Text style={styles.tabCount}>({count})</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.resultScroll}>
          {/* Aggregator widget */}
          <TicketAggregator
            items={displayed}
            fields={JAMAICA_TICKET_FIELDS}
            getFieldValue={(ticket: JamaicaTicket, key) =>
              (ticket as unknown as Record<string, unknown>)[key] ?? null
            }
            getDateValue={(ticket: JamaicaTicket) => ticket.issueDate}
          />

          {displayed.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                name="checkmark.seal.fill"
                size={40}
                color={StatusColors.success}
              />
              <Text style={[styles.emptyText, { color: c.subtext }]}>
                {activeFilter === "unpaid"
                  ? "No outstanding tickets found."
                  : "No tickets found."}
              </Text>
            </View>
          ) : (
            <View>
              {!allSaved && displayed.length > 0 ? (
                <TouchableOpacity onPress={handleSaveAll}>
                  <Text style={[styles.saveAllText, { color: c.tint }]}>
                    Save All
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 56 }} />
              )}
              {displayed.map((ticket) => (
                <TicketResultCard
                  key={ticket.ticketNo}
                  ticket={ticket}
                  saved={hasTicket(`jm-${ticket.ticketNo}`)}
                  onSave={() => handleSaveTicket(ticket)}
                  c={c}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Provider list (default) ──
  const paidCount = allTicketsInStore.filter((t) => t.status === "paid").length;
  const unpaidCount = allTicketsInStore.filter(
    (t) => t.status === "unpaid",
  ).length;
  const totalSavedTickets = allTicketsInStore.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View
        style={[
          styles.topBar,
          { backgroundColor: c.card, borderBottomColor: c.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="xmark" size={20} color={c.tint} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: c.text }]}>
          Ticket Lookup
        </Text>
        <View style={{ width: 20 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.intro, { color: c.subtext }]}>
          Select a service to look up traffic fines and infringement notices.
        </Text>

        {/* View Saved Tickets Button */}
        {totalSavedTickets > 0 && (
          <TouchableOpacity
            style={[
              styles.savedTicketsBtn,
              {
                backgroundColor: c.card,
                borderColor: c.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
            onPress={() => router.push("/(tabs)/tickets")}
            activeOpacity={0.7}
          >
            <View style={styles.savedTicketsContent}>
              <View style={styles.savedTicketsHeader}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: c.tint + "15" },
                  ]}
                >
                  <IconSymbol name="doc.text.fill" size={18} color={c.tint} />
                </View>
                <View style={styles.savedTicketsTextContainer}>
                  <Text style={[styles.savedTicketsTitle, { color: c.text }]}>
                    Your Saved Tickets
                  </Text>
                  <Text
                    style={[styles.savedTicketsSubtitle, { color: c.subtext }]}
                  >
                    {totalSavedTickets} ticket
                    {totalSavedTickets !== 1 ? "s" : ""} on record
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={c.icon} />
              </View>
              <View style={styles.savedTicketsCounts}>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor:
                        unpaidCount > 0 ? StatusColors.dangerBg : c.background,
                      borderColor:
                        unpaidCount > 0 ? StatusColors.danger + "30" : c.border,
                    },
                  ]}
                >
                  <View style={styles.countContent}>
                    <Text
                      style={[
                        styles.countValue,
                        {
                          color: unpaidCount > 0 ? StatusColors.danger : c.text,
                        },
                      ]}
                    >
                      {unpaidCount}
                    </Text>
                    <Text style={[styles.countLabel, { color: c.subtext }]}>
                      Unpaid
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor:
                        paidCount > 0 ? StatusColors.successBg : c.background,
                      borderColor:
                        paidCount > 0 ? StatusColors.success + "30" : c.border,
                    },
                  ]}
                >
                  <View style={styles.countContent}>
                    <Text
                      style={[
                        styles.countValue,
                        {
                          color: paidCount > 0 ? StatusColors.success : c.text,
                        },
                      ]}
                    >
                      {paidCount}
                    </Text>
                    <Text style={[styles.countLabel, { color: c.subtext }]}>
                      Paid
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {providers.length === 0 ? (
          <>
            <Text style={[styles.noProviders, { color: c.subtext }]}>
              No lookup services configured for your region.
            </Text>
            <TouchableOpacity
              style={[
                styles.settingsBtn,
                { borderColor: c.border, backgroundColor: c.card },
              ]}
              onPress={() => router.push("/settings")}
            >
              <IconSymbol name="gearshape.fill" size={16} color={c.tint} />
              <Text style={[styles.settingsBtnText, { color: c.tint }]}>
                Change Region in Settings
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          providers.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => selectProvider(p)}
              activeOpacity={0.75}
            >
              <Card style={styles.providerCard}>
                <View style={styles.providerRow}>
                  <View style={styles.providerInfo}>
                    <Text style={[styles.providerName, { color: c.text }]}>
                      {p.displayName}
                    </Text>
                    <Text
                      style={[
                        styles.providerInstructions,
                        { color: c.subtext },
                      ]}
                    >
                      {p.instructions}
                    </Text>
                    {p.apiLookup ? (
                      <View style={styles.apiBadge}>
                        <Text style={styles.apiBadgeText}>API</Text>
                      </View>
                    ) : null}
                  </View>
                  <IconSymbol name="chevron.right" size={18} color={c.icon} />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  topBarTitle: { flex: 1, fontSize: 16, fontWeight: "600" },
  webview: { flex: 1 },

  // Provider list
  intro: { fontSize: 14, lineHeight: 20 },
  noProviders: { fontSize: 14, textAlign: "center", marginVertical: 24 },
  providerCard: { marginHorizontal: 0 },
  providerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  providerInfo: { flex: 1, gap: 4 },
  providerName: { fontSize: 15, fontWeight: "700" },
  providerInstructions: { fontSize: 13, lineHeight: 18 },
  apiBadge: {
    alignSelf: "flex-start",
    backgroundColor: StatusColors.infoBg,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  apiBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: StatusColors.info,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingsBtnText: { fontSize: 15, fontWeight: "600" },

  // Saved tickets button
  savedTicketsBtn: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  savedTicketsContent: {
    gap: 14,
  },
  savedTicketsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  savedTicketsTextContainer: {
    flex: 1,
    gap: 2,
  },
  savedTicketsTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  savedTicketsSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  savedTicketsCounts: {
    flexDirection: "row",
    gap: 12,
  },
  countBadge: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  countContent: {
    alignItems: "center",
    gap: 4,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  countValue: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 28,
  },

  // Form
  formIntro: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
  licenseInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  licenseInfoTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  licenseInfoText: { fontSize: 12, lineHeight: 17 },
  noLicenseCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  noLicenseTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  noLicenseText: { fontSize: 12, lineHeight: 17 },
  autoFilledCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  autoFilledRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  autoFilledText: {
    fontSize: 13,
    lineHeight: 18,
  },
  modeToggle: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  hint: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 4,
  },
  errorText: { fontSize: 13, lineHeight: 19, fontWeight: "500" },
  errorLink: {
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  lookupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  lookupBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Results
  tabRow: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: "600" },
  tabCount: { fontWeight: "400" },
  resultScroll: { padding: 12, paddingBottom: 40, gap: 12 },
  resultCard: { marginHorizontal: 0, marginBottom: 12 },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  ticketNo: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  offence: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 10,
  },
  resultMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  metaItem: { gap: 2 },
  metaLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  metaValue: { fontSize: 13, fontWeight: "600" },
  courtInfo: { fontSize: 12, marginBottom: 10 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  saveBtnText: { fontSize: 13, fontWeight: "700" },
  saveAllText: {
    fontSize: 14,
    fontWeight: "700",
    width: 56,
    textAlign: "right",
    marginBottom: 12,
  },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
