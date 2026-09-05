@component('emails.layout', ['subject' => $subject])

<p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e8ff00;font-weight:600;">
    Verify Email
</p>

<h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;letter-spacing:1px;color:#f5f0e8;text-transform:uppercase;font-weight:700;">
    Your Code
</h1>

<p style="margin:0 0 28px;font-size:14px;line-height:1.75;color:rgba(245,240,232,0.55);">
    Hi {{ $userName }} — enter this code in the app to confirm your new email address.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
    <tr>
        <td align="center" style="padding:26px 16px;background:rgba(232,255,0,0.05);border:1px dashed rgba(232,255,0,0.35);">
            <p style="margin:0;font-size:38px;font-weight:700;letter-spacing:12px;color:#e8ff00;font-family:'Courier New',monospace;">
                {{ $code }}
            </p>
        </td>
    </tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
    <tr>
        <td style="border-left:2px solid rgba(232,255,0,0.4);padding:12px 16px;background:rgba(245,240,232,0.03);">
            <p style="margin:0;font-size:13px;line-height:1.6;color:rgba(245,240,232,0.5);">
                This code expires in <strong style="color:#e8ff00;">10 minutes</strong>. If you didn't request it, ignore this email — nothing will change.
            </p>
        </td>
    </tr>
</table>

@endcomponent
