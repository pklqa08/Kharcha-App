# Analytics Engine Design

## Supported Metrics
- Today's Expense
- Weekly Summary
- Monthly Summary
- Yearly Summary
- Income
- Expense
- Balance
- Merchant Analysis
- Category Analysis
- Budget Analysis

## Engine Location
- Contracts: frontend/src/domain/interfaces/analytics-engine.types.ts
- Service: frontend/src/application/services/analytics-engine.service.ts

## Core API
- getPeriodSummary(period)
- getMerchantAnalysis(period)
- getCategoryAnalysis(period)
- getBudgetAnalysis()
- getInsights()
- getDashboard()

## Design Notes
- Uses period-aware range resolution for today, weekly, monthly, yearly.
- Computes balance as income - expense.
- Merchant analysis includes avg ticket and expense share percent.
- Category analysis includes expense share percent.
- Budget analysis maps monthly category spend against configured budgets and flags health:
  - on_track
  - near_limit
  - over_budget

## AI-Ready Extensibility
Future AI insights are designed through pluggable provider contract:
- IAnalyticsInsightProvider.generate(snapshot)

When plugged in, it receives a complete snapshot containing:
- period summaries
- merchant analysis
- category analysis
- budget analysis

This enables future anomaly detection, trend forecasting, recommendations, and budgeting guidance without changing the engine interface.
