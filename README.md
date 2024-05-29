#Order Cancel Lambda

Simple function to query orders by status and cancel them.

`ORDER_AUTO_CANCEL_AGE` should be in milliseconds and is subtracted from the current time.  So set the number of ms to the age of unmodified order.  Default is 172800000, so any orders that have not been updated in 2 days from invocation.