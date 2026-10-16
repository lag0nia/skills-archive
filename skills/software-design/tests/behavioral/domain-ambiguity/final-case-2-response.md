I’m using the software-design skill to settle one remaining behavior choice: whether “before shipment” applies to each item or to the order’s first shipment.

For example, a customer’s order contains three items: one has shipped and two have not. The customer requests cancellation. Which outcome should apply?

- **Cancel the unshipped remainder:** cancel the two unshipped items; the shipped item continues unaffected.
- **Close cancellation after the first shipment:** reject the request; neither remaining item is cancelled.

Both preserve the approved rule that cancellation must never recall a shipped item. The current implementation follows the second option, but it predates separate shipments, so it does not settle the intended rule for mixed orders.

I recommend **cancelling the unshipped remainder**, assuming the intent is to preserve cancellation eligibility for each item until it ships. This fits separate shipments, but it is still a product choice awaiting your answer. Under that rule, the cancellation result must distinguish cancelled items from the shipped item; it cannot describe the entire order as cancelled.

Should a customer be able to cancel the unshipped remainder once another item has shipped?
