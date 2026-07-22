# Database schema (MongoDB) - concise reference

This file summarizes collections, key fields, recommended indexes, and example aggregation pipelines for reporting.

## Collections (short form)

- `Users`( _id, Email, PasswordHash, FirstName, LastName, Role, Phone, CreatedAt, LastLogin, IsActive, MarketingOptIn )
- `Products`( _id, Name, Slug, Description, Price, OriginalPrice, CategoryId, Brand, Model, Stock, IsActive, OnSale, Discount, Rating, ReviewCount, ImageUrl, Attributes, CreatedAt, UpdatedAt )
- `Categories`( _id, Name, Slug, Description, ParentId, CreatedAt )
- `Orders`( _id, UserId, Items[ { ProductId, ProductName, ProductImage, Quantity, Price } ], Subtotal, Tax, ShippingCost, Total, Status, PaymentId, ShippingInfo{ Name, Address, City, State, Zip, Country, Email, Phone }, TrackingNumber, Carrier, EstimatedDelivery, CreatedAt, UpdatedAt, StatusHistory[] )
- `Payments`( _id, OrderId, UserId, Amount, Method, Status, TransactionId, Fee, CreatedAt )
- `CartItems`( _id, UserId, ProductId, Quantity, AddedAt )
- `WishlistItems`( _id, UserId, ProductId, AddedAt )
- `Reviews`( _id, UserId, ProductId, Rating, Title, Comment, CreatedAt )
- `Addresses`( _id, UserId, Street, City, State, ZipCode, Country, IsDefault, CreatedAt )
- `StockTransactions`( _id, ProductId, Change, Reason, SourceId, CreatedAt )
- `Sessions` (optional) ( _id, SessionId, UserId?, StartedAt, DurationSec, EventsCount, Device, Source )

## Materialized / Aggregate Collections (recommended)

- `DailyMetrics`( date, OrdersCount, Revenue, Refunds, AvgOrderValue, UniqueBuyers, Sessions, PageViews ) — precomputed daily KPIs
- `ProductSales`( productId, windowStart, windowEnd, QuantitySold, Revenue ) — sliding/windowed product metrics
- `CategoryDailySales`( date, CategoryId, OrdersCount, Revenue )

## Recommended indexes (high level)

- `Users`: Email (unique), LastLogin
- `Products`: CategoryId, Price, IsActive, text(Name, Description)
- `Orders`: CreatedAt, Status, UserId; consider compound `(Status, CreatedAt)` for status time-series
- `Reviews`: ProductId, UserId (unique per user+product)
- `DailyMetrics`: date (ascending)
- `Sessions`: TTL or periodic cleanup for retention

Notes: avoid expensive `unwind` on very large `Orders` by maintaining `ProductSales` materialized aggregates updated by background jobs.

## Example aggregation pipelines

1) Revenue by day (last N days) — Mongo shell pipeline

```
const pipeline = [
  { $match: { CreatedAt: { $gte: ISODate("2026-05-01T00:00:00Z"), $lt: ISODate("2026-06-01T00:00:00Z") }, Status: { $in: ["Paid","Delivered"] } } },
  { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$CreatedAt" } }, revenue: { $sum: "$Total" }, orders: { $sum: 1 } } },
  { $sort: { _id: 1 } }
];
db.orders.aggregate(pipeline);
```

2) Top N products by quantity sold (period)

```
const pipeline = [
  { $match: { CreatedAt: { $gte: start, $lt: end }, Status: { $in: ["Paid","Delivered"] } } },
  { $unwind: "$Items" },
  { $group: { _id: "$Items.ProductId", qty: { $sum: "$Items.Quantity" }, revenue: { $sum: { $multiply: ["$Items.Quantity","$Items.Price"] } } } },
  { $sort: { qty: -1 } },
  { $limit: 10 }
];
db.orders.aggregate(pipeline);
```

3) Revenue by category (period) — uses lookup to map product -> category

```
const pipeline = [
  { $match: { CreatedAt: { $gte: start, $lt: end }, Status: { $in: ["Paid","Delivered"] } } },
  { $unwind: "$Items" },
  { $lookup: { from: "products", localField: "Items.ProductId", foreignField: "_id", as: "product" } },
  { $unwind: "$product" },
  { $group: { _id: "$product.CategoryId", revenue: { $sum: { $multiply: ["$Items.Quantity","$Items.Price"] } }, orders: { $sum: 1 } } },
  { $sort: { revenue: -1 } }
];
db.orders.aggregate(pipeline);
```

4) Conversion rate by day (idea)

- If `Sessions` collection exists: compute unique sessions per day and unique buyers per day; conversion = buyers / sessions.
- Otherwise, use `DailyMetrics` that contains `Sessions` and `UniqueBuyers` precomputed.

## Next steps (suggested)

- Implement background worker to update `DailyMetrics` and `ProductSales` daily or in near-real-time.
- Add indexes to collections listed above.
- Provide C# driver pipeline samples if required.

---
Generated for quick reporting and analytics tasks. Update as schema evolves.
