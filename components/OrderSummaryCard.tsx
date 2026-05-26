import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { EventCurrency } from "@/types/event";

const theme = { colors: Colors.dark, fonts: Fonts };

interface OrderSummaryCardProps {
  eventTitle: string;
  subtotal: number;
  fee: number;
  total: number;
  currency: EventCurrency;
}

const formatCurrency = (amount: number, currency: EventCurrency) => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount
  );
};

const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  eventTitle,
  subtotal,
  fee,
  total,
  currency,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{eventTitle}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Subtotal</Text>
        <Text style={styles.value}>{formatCurrency(subtotal, currency)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Booking Fee</Text>
        <Text style={styles.value}>{formatCurrency(fee, currency)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total, currency)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.text,
    paddingBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    color: theme.colors.text,
  },
  value: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.tint,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
});

export default OrderSummaryCard;
