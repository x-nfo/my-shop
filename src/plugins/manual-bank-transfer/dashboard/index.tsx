import { Badge } from '@/vdb/components/ui/badge.js';
import { Button } from '@/vdb/components/ui/button.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/vdb/components/ui/card.js';
import { defineDashboardExtension } from '@vendure/dashboard';
import { api } from '@/vdb/graphql/api.js';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

type ManualTransferCustomFields = {
    manualTransferProofAsset?: {
        id?: string;
        preview?: string;
        source?: string;
        name?: string;
    } | null;
    manualTransferProofUploadedAt?: string | null;
    manualTransferVerificationStatus?: string | null;
    manualTransferVerificationNote?: string | null;
    manualTransferVerifiedAt?: string | null;
};

type OrderEntity = {
    id: string;
    code: string;
    payments?: Array<{ method?: string; state?: string }>;
    customFields?: ManualTransferCustomFields;
};

const VERIFY_MUTATION = `
    mutation VerifyManualTransferPayment($orderId: ID!, $note: String) {
        verifyManualTransferPayment(orderId: $orderId, note: $note) {
            id
            code
            customFields
        }
    }
`;

const REJECT_MUTATION = `
    mutation RejectManualTransferProof($orderId: ID!, $note: String) {
        rejectManualTransferProof(orderId: $orderId, note: $note) {
            id
            code
            customFields
        }
    }
`;

function ManualTransferVerificationCard({ context }: { context: { entity?: OrderEntity } }) {
    const entity = context.entity;
    const [reviewNote, setReviewNote] = useState('');
    const verifyMutation = useMutation({
        mutationFn: (variables: { orderId: string; note?: string }) => api.mutate(VERIFY_MUTATION, variables),
        onSuccess: () => {
            toast.success('Manual transfer verified');
            window.location.reload();
        },
        onError: error => {
            toast.error('Failed to verify manual transfer', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        },
    });
    const rejectMutation = useMutation({
        mutationFn: (variables: { orderId: string; note?: string }) => api.mutate(REJECT_MUTATION, variables),
        onSuccess: () => {
            toast.success('Manual transfer proof rejected');
            window.location.reload();
        },
        onError: error => {
            toast.error('Failed to reject proof', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        },
    });

    if (!entity) {
        return null;
    }

    const customFields = entity.customFields ?? {};
    const proofAsset = customFields.manualTransferProofAsset;
    const verificationStatus = customFields.manualTransferVerificationStatus ?? 'PENDING';
    const hasManualTransferPayment = entity.payments?.some(payment => payment.method === 'manual-bank-transfer');

    if (!proofAsset && !hasManualTransferPayment) {
        return null;
    }

    const isPending = verificationStatus === 'PENDING';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manual Transfer Verification</CardTitle>
                <CardDescription>Review uploaded proof and settle the payment manually.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={verificationStatus === 'APPROVED' ? 'default' : verificationStatus === 'REJECTED' ? 'destructive' : 'secondary'}>
                        {verificationStatus}
                    </Badge>
                </div>
                {proofAsset ? (
                    <div className="space-y-3">
                        {proofAsset.preview ? (
                            <img
                                alt={proofAsset.name ?? `Transfer proof for ${entity.code}`}
                                className="max-h-80 w-full rounded-md border object-contain bg-muted/30"
                                src={proofAsset.preview}
                            />
                        ) : null}
                        <a
                            className="text-sm underline"
                            href={proofAsset.source ?? proofAsset.preview ?? '#'}
                            rel="noreferrer"
                            target="_blank"
                        >
                            Open uploaded proof
                        </a>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Customer has not uploaded transfer proof yet.</p>
                )}
                <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="manual-transfer-note">
                        Review note
                    </label>
                    <textarea
                        className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                        id="manual-transfer-note"
                        onChange={event => setReviewNote(event.target.value)}
                        placeholder="Optional note for approval or rejection"
                        value={reviewNote}
                    />
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        disabled={!proofAsset || !isPending || verifyMutation.isPending}
                        onClick={() => verifyMutation.mutate({ orderId: entity.id, note: reviewNote || undefined })}
                    >
                        Verify & Settle
                    </Button>
                    <Button
                        disabled={!proofAsset || !isPending || rejectMutation.isPending}
                        onClick={() => rejectMutation.mutate({ orderId: entity.id, note: reviewNote || undefined })}
                        variant="outline"
                    >
                        Reject Proof
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

defineDashboardExtension({
    pageBlocks: [
        {
            id: 'manual-transfer-verification',
            title: 'Manual Transfer',
            location: {
                pageId: 'order-detail',
                position: { blockId: 'order-history', order: 'before' },
                column: 'side',
            },
            component: ManualTransferVerificationCard,
            requiresPermission: ['ReadOrder'],
        },
    ],
});
