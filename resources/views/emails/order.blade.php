@component('emails.layout', ['subject' => $subject])

<p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:{{ $accent }};font-weight:600;">
    {{ $order->reference }}
</p>

<h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;letter-spacing:1px;color:#f5f0e8;text-transform:uppercase;font-weight:700;">
    {{ $heading }}
</h1>

<p style="margin:0 0 24px;font-size:14px;line-height:1.75;color:rgba(245,240,232,0.55);">
    {{ $body }}
</p>

@if($note)
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr>
        <td style="border-left:2px solid {{ $accent }};padding:12px 16px;background:rgba(245,240,232,0.03);">
            <p style="margin:0;font-size:13px;line-height:1.6;color:rgba(245,240,232,0.6);">
                {{ $note }}
            </p>
        </td>
    </tr>
</table>
@endif

@if($showReceipt)
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-top:1px solid rgba(245,240,232,0.08);">
    @foreach($order->items as $item)
    <tr>
        <td style="padding:14px 0;border-bottom:1px solid rgba(245,240,232,0.05);">
            <p style="margin:0;font-size:14px;color:#f5f0e8;font-weight:500;">
                {{ $item->product->name ?? 'Product' }}
            </p>
            <p style="margin:4px 0 0;font-size:12px;color:rgba(245,240,232,0.38);">
                Qty {{ $item->quantity }} &times; &#8358;{{ number_format((float) $item->price) }}
            </p>
        </td>
        <td align="right" style="padding:14px 0;border-bottom:1px solid rgba(245,240,232,0.05);white-space:nowrap;">
            <p style="margin:0;font-size:14px;color:{{ $accent }};font-weight:600;">
                &#8358;{{ number_format((float) $item->price * $item->quantity) }}
            </p>
        </td>
    </tr>
    @endforeach
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
    <tr>
        <td style="padding:4px 0;font-size:13px;color:rgba(245,240,232,0.45);">Subtotal</td>
        <td align="right" style="padding:4px 0;font-size:13px;color:rgba(245,240,232,0.75);">
            &#8358;{{ number_format((float) $order->subtotal) }}
        </td>
    </tr>
    <tr>
        <td style="padding:4px 0;font-size:13px;color:rgba(245,240,232,0.45);">Shipping</td>
        <td align="right" style="padding:4px 0;font-size:13px;color:rgba(245,240,232,0.75);">
            &#8358;{{ number_format((float) $order->shipping_fee) }}
        </td>
    </tr>
    <tr>
        <td style="padding:14px 0 0;border-top:1px solid rgba(245,240,232,0.08);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(245,240,232,0.45);font-weight:700;">
            Total Paid
        </td>
        <td align="right" style="padding:14px 0 0;border-top:1px solid rgba(245,240,232,0.08);font-size:22px;color:{{ $accent }};font-weight:700;">
            &#8358;{{ number_format((float) $order->total_amount) }}
        </td>
    </tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
    <tr>
        <td style="padding:16px;background:rgba(245,240,232,0.03);border:1px solid rgba(245,240,232,0.06);">
            <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(245,240,232,0.35);font-weight:700;">
                Delivering To
            </p>
            <p style="margin:0;font-size:13px;line-height:1.7;color:rgba(245,240,232,0.6);">
                <span style="color:rgba(245,240,232,0.85);font-weight:500;">{{ $order->ship_full_name }}</span><br>
                {{ $order->ship_phone }}<br>
                {{ $order->ship_street }}@if($order->ship_apartment), {{ $order->ship_apartment }}@endif<br>
                {{ $order->ship_city }}, {{ $order->ship_state }}<br>
                {{ $order->ship_country }}
            </p>
        </td>
    </tr>
</table>
@endif

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
    <tr>
        <td style="background:{{ $accent }};">
            <a href="{{ $ctaUrl }}"
               style="display:inline-block;padding:14px 28px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
                {{ $ctaLabel }}
            </a>
        </td>
    </tr>
</table>

@endcomponent
