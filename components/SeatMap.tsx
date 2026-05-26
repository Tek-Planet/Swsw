import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  Venue,
  Seat,
  MAX_MOVIE_SEATS_PER_ORDER,
  SeatStatus,
} from "../types/movie";
import { EventCurrency } from "../types/event";

import { useAuth } from "../lib/context/AuthContext";
import { Colors, Fonts } from "../constants/theme";
import { Feather } from "@expo/vector-icons";

const theme = { colors: Colors.dark, fonts: Fonts };

// Helper to format price
const formatPrice = (price: number, currency: EventCurrency = "HKD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
};

interface SeatMapProps {
  venue: Venue;
  seats: Record<string, Seat>;
  soldSeatIds: string[];
  selected: string[];
  onToggle: (seatId: string) => void;
  currency?: EventCurrency;
}

const SeatMap: React.FC<SeatMapProps> = ({
  venue,
  seats,
  soldSeatIds,
  selected,
  onToggle,
  currency,
}) => {
  const { user } = useAuth();
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const soldSet = useMemo(() => new Set(soldSeatIds || []), [soldSeatIds]);
  const cur = currency ?? venue.currency ?? "HKD";
  const atCap = selected.length >= MAX_MOVIE_SEATS_PER_ORDER;

  return (
    <View style={styles.container}>
      {/* Screen */}
      <View style={styles.screenContainer}>
        <View style={styles.screenArc} />
        <Text style={styles.screenText}>SCREEN</Text>
      </View>

      <ScrollView horizontal contentContainerStyle={styles.scrollViewContent}>
        <View>
          {venue.rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              {row.seats.map((venueSeat, idx) => {
                if (venueSeat.type === "aisle") {
                  return <View key={`aisle-${idx}`} style={styles.aisle} />;
                }

                const seatId = `${row.label}-${venueSeat.label}`;
                const liveSeat = seats[seatId];
                const status: SeatStatus = liveSeat?.status ?? "available";

                const isMine = liveSeat?.heldBy === user?.uid;
                const isSelected = selectedSet.has(seatId);
                const isSold = soldSet.has(seatId);

                const isDisabled =
                  isSold ||
                  status === "sold" ||
                  status === "blocked" ||
                  (status === "held" && !isMine) ||
                  (!isSelected && atCap);

                const getSeatStyle = () => {
                  if (isSelected) return styles.selectedSeat;
                  if (isSold || status === "sold") return styles.soldSeat;
                  if (status === "held") return styles.heldSeat;
                  if (status === "blocked") return styles.blockedSeat;
                  return styles.availableSeat;
                };

                const getTextStyle = () => {
                  if (isSelected) return styles.selectedSeatText;
                  if (isSold || status === "sold") return styles.soldSeatText;
                  if (status === "held") return styles.heldSeatText;
                  return styles.availableSeatText;
                };

                return (
                  <TouchableOpacity
                    key={seatId}
                    disabled={isDisabled}
                    onPress={() => onToggle(seatId)}
                    style={[
                      styles.seat,
                      getSeatStyle(),
                      isDisabled && styles.disabledSeat,
                    ]}
                  >
                    {venueSeat.type === "wheelchair" ? (
                      <Feather
                        name="crosshair"
                        size={14}
                        color={isSelected ? "#fff" : theme.colors.tint}
                      />
                    ) : (
                      <Text style={getTextStyle()}>{venueSeat.label}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              <Text style={styles.rowLabel}>{row.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendDot style={styles.availableSeat} label="Available" />
        <LegendDot style={styles.selectedSeat} label="Selected" />
        <LegendDot style={styles.heldSeat} label="Held" />
        <LegendDot style={styles.soldSeat} label="Sold" />
      </View>

      {atCap && (
        <Text style={styles.capWarning}>
          Maximum {MAX_MOVIE_SEATS_PER_ORDER} seats per order.
        </Text>
      )}
    </View>
  );
};

const LegendDot = ({ style, label }: { style: object; label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, style]} />
    <Text style={styles.legendLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: "center",
  },
  screenContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  screenArc: {
    width: "80%",
    height: 20,
    borderTopWidth: 4,
    borderTopColor: theme.colors.tint,
    borderStyle: "solid",
    borderRadius: 10,
    opacity: 0.7,
  },
  screenText: {
    marginTop: 4,
    color: theme.colors.icon,
    fontSize: 10,
    letterSpacing: 2,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  rowLabel: {
    width: 20,
    textAlign: "center",
    fontSize: 12,
    color: theme.colors.icon,
    marginHorizontal: 4,
  },
  seat: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    margin: 2,
    borderWidth: 1,
  },
  aisle: {
    width: 15,
  },
  availableSeat: {
    backgroundColor: "#1C1C1E",
    borderColor: "#333",
  },
  availableSeatText: {
    fontSize: 10,
    color: theme.colors.text,
  },
  selectedSeat: {
    backgroundColor: theme.colors.tint,
    borderColor: theme.colors.tint,
  },
  selectedSeatText: {
    fontSize: 10,
    color: "#000",
    fontWeight: "bold",
  },
  soldSeat: {
    backgroundColor: "#333",
    borderColor: "#555",
  },
  soldSeatText: {
    fontSize: 10,
    color: "#888",
  },
  heldSeat: {
    backgroundColor: "#FFC107",
    borderColor: "#FFC107",
  },
  heldSeatText: {
    fontSize: 10,
    color: "#000",
  },
  blockedSeat: {
    backgroundColor: "#ff4d4d",
    borderColor: "#ff4d4d",
  },
  disabledSeat: {
    opacity: 0.5,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
    color: theme.colors.icon,
  },
  capWarning: {
    textAlign: "center",
    fontSize: 12,
    color: "#FFC107",
    marginTop: 10,
  },
});

export default SeatMap;
