;; Biometric Seedless Smart Wallet (Production Grade)
(impl-trait 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.nft-trait.nft-trait) ;; Example trait

(define-data-var owner-pubkey (buff 33) 0x00)
(define-data-var nonce uint u0)
(define-data-var initialized bool false)

;; Constants
(define-constant ERR-INVALID-SIGNATURE (err u100))
(define-constant ERR-ALREADY-INITIALIZED (err u103))
(define-constant ERR-NOT-INITIALIZED (err u104))
(define-constant ERR-TRANSFER-FAILED (err u105))

;; Domain Separator (Prevents replay across different wallets/chains)
(define-read-only (get-domain-hash)
    (sha256 (unwrap-panic (to-consensus-buff? {
        name: "Seedless-Wallet",
        version: "1.0.0",
        chain-id: chain-id,
        wallet-id: (as-contract tx-sender)
    })))
)

(define-public (initialize (new-owner-pubkey (buff 33)))
    (begin
        (asserts! (not (var-get initialized)) ERR-ALREADY-INITIALIZED)
        (var-set owner-pubkey new-owner-pubkey)
        (var-set initialized true)
        (ok true)
    )
)

;; Executes a signed STX transfer
(define-public (send-stx (amount uint) (recipient principal) (signature (buff 64)))
    (let
        (
            (current-nonce (var-get nonce))
            ;; The hash MUST match what the frontend signs
            (message-hash (sha256 (unwrap-panic (to-consensus-buff? {
                domain: (get-domain-hash),
                action: "transfer",
                amount: amount,
                recipient: recipient,
                nonce: current-nonce
            }))))
        )
        (asserts! (var-get initialized) ERR-NOT-INITIALIZED)
        
        ;; Verify Biometric Signature (secp256r1)
        (asserts! (secp256r1-verify message-hash signature (var-get owner-pubkey)) ERR-INVALID-SIGNATURE)
        
        ;; Update state
        (var-set nonce (+ current-nonce u1))
        
        ;; Execute the actual transfer from the contract's balance
        (as-contract (stx-transfer? amount tx-sender recipient))
    )
)

;; Read-only helpers
(define-read-only (get-nonce) (ok (var-get nonce)))
(define-read-only (get-owner-pubkey) (ok (var-get owner-pubkey)))
