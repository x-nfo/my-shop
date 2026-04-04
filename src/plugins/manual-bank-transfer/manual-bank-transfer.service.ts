import { Injectable } from '@nestjs/common';
import {
    AssetService,
    MimeTypeError,
    RequestContext,
    OrderService,
    IllegalOperationError,
    EntityNotFoundError,
    ID,
    UserInputError,
    Payment,
} from '@vendure/core';
import { MANUAL_BANK_TRANSFER_HANDLER_CODE, ManualTransferVerificationStatus } from './manual-bank-transfer.types';

const MAX_PROOF_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROOF_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface UploadLike {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => NodeJS.ReadableStream & { destroy?: () => void };
}

@Injectable()
export class ManualBankTransferService {
    constructor(
        private assetService: AssetService,
        private orderService: OrderService,
    ) {}

    async submitManualTransferProof(ctx: RequestContext, orderCode: ID, file: UploadLike, note?: string) {
        const order = await this.orderService.findOneByCode(ctx, orderCode.toString(), [
            'customer',
            'customer.user',
            'payments',
            'customFields.manualTransferProofAsset',
        ]);
        if (!order) {
            throw new EntityNotFoundError('Order', orderCode);
        }

        if (!ctx.activeUserId) {
            throw new IllegalOperationError('You must be logged in to submit transfer proof');
        }
        if (order.customer?.user?.id !== ctx.activeUserId) {
            throw new IllegalOperationError('You can only submit proof for your own orders');
        }

        const manualTransferPayment = this.getAuthorizedManualTransferPayment(order.payments);
        if (!manualTransferPayment) {
            throw new IllegalOperationError('No authorized manual bank transfer payment found for this order');
        }

        this.validateUpload(file);
        await this.validateFileSize(file);

        const asset = await this.assetService.create(ctx, {
            file,
            tags: ['manual-transfer-proof'],
        });

        if (asset instanceof MimeTypeError) {
            throw new UserInputError(`Unsupported proof file type: ${asset.mimeType}`);
        }

        const updatedCustomFields = {
            ...(order.customFields as Record<string, unknown>),
            manualTransferProofAssetId: asset.id,
            manualTransferProofUploadedAt: new Date(),
            manualTransferVerificationStatus: ManualTransferVerificationStatus.PENDING,
            manualTransferVerificationNote: this.normalizeOptionalText(note),
            manualTransferVerifiedAt: null,
        };

        return this.orderService.updateCustomFields(ctx, order.id, updatedCustomFields);
    }

    async verifyManualTransferPayment(ctx: RequestContext, orderId: ID, note?: string) {
        const order = await this.orderService.findOne(ctx, orderId, [
            'payments',
            'customFields.manualTransferProofAsset',
        ]);
        if (!order) {
            throw new EntityNotFoundError('Order', orderId);
        }
        if (!(order.customFields as Record<string, unknown> | undefined)?.manualTransferProofAsset) {
            throw new IllegalOperationError('Transfer proof has not been uploaded for this order');
        }

        const authorizedPayment = this.getAuthorizedManualTransferPayment(order.payments);
        if (!authorizedPayment) {
            throw new IllegalOperationError('No authorized manual bank transfer payment found for this order');
        }

        const settledPayment = await this.orderService.settlePayment(ctx, authorizedPayment.id);
        if (settledPayment instanceof Payment === false) {
            throw new IllegalOperationError(settledPayment.message);
        }

        return this.orderService.updateCustomFields(ctx, order.id, {
            ...(order.customFields as Record<string, unknown>),
            manualTransferVerificationStatus: ManualTransferVerificationStatus.APPROVED,
            manualTransferVerificationNote: this.normalizeOptionalText(note),
            manualTransferVerifiedAt: new Date(),
        });
    }

    async rejectManualTransferProof(ctx: RequestContext, orderId: ID, note?: string) {
        const order = await this.orderService.findOne(ctx, orderId, [
            'payments',
            'customFields.manualTransferProofAsset',
        ]);
        if (!order) {
            throw new EntityNotFoundError('Order', orderId);
        }
        if (!(order.customFields as Record<string, unknown> | undefined)?.manualTransferProofAsset) {
            throw new IllegalOperationError('Transfer proof has not been uploaded for this order');
        }
        if (!this.getAuthorizedManualTransferPayment(order.payments)) {
            throw new IllegalOperationError('No authorized manual bank transfer payment found for this order');
        }

        return this.orderService.updateCustomFields(ctx, order.id, {
            ...(order.customFields as Record<string, unknown>),
            manualTransferVerificationStatus: ManualTransferVerificationStatus.REJECTED,
            manualTransferVerificationNote: this.normalizeOptionalText(note),
            manualTransferVerifiedAt: new Date(),
        });
    }

    private getAuthorizedManualTransferPayment(payments: Payment[]): Payment | undefined {
        return payments.find(payment => payment.method === MANUAL_BANK_TRANSFER_HANDLER_CODE && payment.state === 'Authorized');
    }

    private normalizeOptionalText(input?: string): string | null {
        if (typeof input !== 'string') {
            return null;
        }
        const normalized = input.trim();
        return normalized.length > 0 ? normalized : null;
    }

    private validateUpload(file: UploadLike): void {
        if (!ALLOWED_PROOF_MIME_TYPES.has(file.mimetype)) {
            throw new UserInputError('Proof of transfer must be a JPG, PNG, or WEBP image');
        }
    }

    private async validateFileSize(file: UploadLike): Promise<void> {
        const stream = file.createReadStream();
        let totalBytes = 0;

        await new Promise<void>((resolve, reject) => {
            stream.on('data', chunk => {
                totalBytes += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(String(chunk));
                if (totalBytes > MAX_PROOF_FILE_SIZE_BYTES) {
                    if (typeof stream.destroy === 'function') {
                        stream.destroy();
                    }
                    reject(new UserInputError('Proof of transfer must be 5 MB or smaller'));
                }
            });
            stream.on('end', () => resolve());
            stream.on('error', error => reject(error));
        });
    }
}
