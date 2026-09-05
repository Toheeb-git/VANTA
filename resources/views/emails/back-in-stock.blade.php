@component('emails.layout', ['subject' => $subject])

<p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e8ff00;font-weight:600;">
    Back In Stock
</p>

<h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;letter-spacing:1px;color:#f5f0e8;text-transform:uppercase;font-weight:700;">
    It's Available Again
</h1>

<p style="margin:0 0 26px;font-size:14px;line-height:1.75;color:rgba(245,240,232,0.55);">
    Hi {{ $userName }} — something on your wishlist just came back.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;background:rgba(245,240,232,0.03);border:1px solid rgba(245,240,232,0.08);">
    <tr>
        <td width="110" style="padding:16px;">
            <img src="{{ $appUrl }}/storage/{{ $product->image }}"
                 alt="{{ $product->name }}"
                 width="94"
                 style="display:block;width:94px;height:94px;object-fit:cover;border:1px solid rgba(245,240,232,0.08);" />
        </td>
        <td style="padding:16px 16px 16px 0;vertical-align:middle;">
            <p style="margin:0 0 6px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(245,240,232,0.35);">
                {{ $product->category }}
            </p>
            <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#f5f0e8;">
                {{ $product->name }}
            </p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#e8ff00;">
                ₦{{ number_format($product->price) }}
            </p>
        </td>
    </tr>
</table>

@if($product->stock <= 5)
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
    <tr>
        <td style="border-left:2px solid #ffaa3c;padding:12px 16px;background:rgba(255,170,60,0.06);">
            <p style="margin:0;font-size:13px;line-height:1.6;color:rgba(255,170,60,0.9);">
                Only <strong>{{ $product->stock }}</strong> left — this one tends to go quickly.
            </p>
        </td>
    </tr>
</table>
@endif

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
    <tr>
        <td style="background:#e8ff00;">
            <a href="{{ $appUrl }}/wishlist"
               style="display:inline-block;padding:14px 28px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
                View My Wishlist
            </a>
        </td>
    </tr>
</table>

@endcomponent

