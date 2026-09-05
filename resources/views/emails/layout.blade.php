<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $subject ?? config('app.name') }}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#161616;border:1px solid rgba(245,240,232,0.08);">

                    <tr>
                        <td style="padding:28px 32px 20px;border-bottom:1px solid rgba(245,240,232,0.08);">
                            <p style="margin:0;font-size:24px;font-weight:700;letter-spacing:4px;color:#f5f0e8;">
                                VANTA
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px;">
                            {!! $slot !!}
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:20px 32px 28px;border-top:1px solid rgba(245,240,232,0.08);">
                            <p style="margin:0;font-size:11px;line-height:1.7;color:rgba(245,240,232,0.28);">
                                You're receiving this because you placed an order with VANTA.<br>
                                Questions? Reply to this email and we'll help.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
