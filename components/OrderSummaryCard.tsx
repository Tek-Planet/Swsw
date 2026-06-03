import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Event, EventCurrency } from "@/types/event";
import { Seat } from "@/types/movie";

// Helper function to format currency, now with a fallback
const formatCurrency = (
  amount: number,
  currency: EventCurrency | undefined
) => {
  // Fallback to a default currency (e.g., 'INR') if the provided currency is undefined
  const displayCurrency = currency || "INR";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: displayCurrency,
    }).format(amount);
  } catch (e) {
    // If currency code is still invalid, just return the number
    return `${displayCurrency} ${amount}`;
  }
};

const OrderSummaryCard = ({
  event,
  selectedSeats,
  pricing,
  currencySymbol,
}: {
  event: Event;
  selectedSeats: Seat[];
  pricing: {
    subtotal: number;
    processingFee: number;
    discount: number;
    total: number;
  };
  currencySymbol: string;
}) => {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.eventTitle}>{event.title}</Text>

      {selectedSeats.map((seat) => (
        <View key={seat.id} style={styles.itemRow}>
          <Text style={styles.itemName}>Seat {seat.label}</Text>
          <Text style={styles.itemPrice}>
            {currencySymbol}
            {seat.price.toLocaleString()}
          </Text>
        </View>
      ))}

      <View style={styles.subtotalContainer}>
        <Text style={styles.summaryText}>Subtotal</Text>
        <Text style={styles.summaryText}>
          {currencySymbol}
          {pricing.subtotal.toLocaleString()}
        </Text>
      </View>

      {pricing.processingFee > 0 && (
        <View style={styles.subtotalContainer}>
          <Text style={styles.summaryText}>
            Processing fee ({event.bookingFeePercent}%)
          </Text>
          <Text style={styles.summaryText}>
            {currencySymbol}
            {pricing.processingFee.toLocaleString()}
          </Text>
        </View>
      )}

      {pricing.discount > 0 && (
        <View style={styles.subtotalContainer}>
          <Text style={[styles.summaryText, { color: "#4CAF50" }]}>
            Discount
          </Text>
          <Text style={[styles.summaryText, { color: "#4CAF50" }]}>
            -{currencySymbol}
            {pricing.discount.toLocaleString()}
          </Text>
        </View>
      )}

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total</Text>
        <Text style={styles.totalText}>
          {/* Apply the fix by calling the robust formatCurrency function */}
          {formatCurrency(pricing.total, event.currency)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  eventTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 15,
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemName: { color: "#ddd", fontSize: 16, flexShrink: 1 },
  itemPrice: { color: "#ddd", fontSize: 16, fontWeight: "500" },
  summaryText: { color: "#aaa", fontSize: 16 },
  subtotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 15,
    marginTop: 15,
  },
  totalText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

export default OrderSummaryCard;
