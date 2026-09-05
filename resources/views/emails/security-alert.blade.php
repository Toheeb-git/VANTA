@component('emails.layout', ['subject' => $subject])

<p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#ff3d2e;font-weight:600;">
    Security Alert
</p>

<h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;letter-spacing:1px;color:#f5f0e8;text-transform:uppercase;font-weight:700;">
    {{ $heading }}
</h1>

<p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:rgba(245,240,232,0.55);">
    Hi {{ $userName }} — {!! $body !!}
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
    <tr>
        <td style="border-left:2px solid #ff3d2e;padding:14px 16px;background:rgba(255,61,46,0.06);">
            <p style="margin:0;font-size:13px;line-height:1.65;color:rgba(255,61,46,0.9);">
                {{ $actionText }}
            </p>
        </td>
    </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
    <tr>
        <td style="background:#e8ff00;">
            <a href="{{ $ctaUrl }}"
               style="display:inline-block;padding:14px 28px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">
                {{ $ctaLabel }}
            </a>
        </td>
    </tr>
</table>

@endcomponent
