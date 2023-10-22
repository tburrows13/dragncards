import React from "react";
import ReactModal from "react-modal";
import Button from "../../components/basic/Button";
import { PleaseLogIn } from "../lobby/PleaseLogIn";
import PatreonButton from "./PatreonButton";

ReactModal.setAppElement("#root");

export const PatreonModal = ({
  isOpen,
  isLoggedIn,
  closeModal
}) => {
    const tiers = [
        { 
          amount: 300, 
          benefits: ["Unlimited saved games"] 
        },
        { 
          amount: 500, 
          benefits: ["All lower tier benefits", "Custom alt art cards", "Custom card backs", "Custom backgrounds"] 
        },
        { 
          amount: 1000, 
          benefits: ["All lower tier benefits", `Optional "Esteemed Supporter" discord role`] 
        },
    ];

  const patreonClientId = "MUANs_lS4yBmji1txII2sV6NJ3X1JEp5OSzPVr_rkU02jz3S2jTubjoMOSPK5Jul";
  const redirectURI = "https://www.dragncards.com/auth/patreon/callback";

  return (
    <ReactModal
      closeTimeoutMS={200}
      isOpen={isOpen}
      onRequestClose={closeModal}
      contentLabel="Support on Patreon"
      overlayClassName="fixed inset-0 bg-black-50  z-10000"
      className="insert-auto p-5 bg-gray-700 border mx-auto rounded-lg my-12 outline-none"
      style={{
        overlay: {
        },
        content: {
          width: '400px',
        }
      }}>
      <h1 className="mb-2">Support on Patreon</h1>
      {isLoggedIn ? (
        <>
          <div className="text-white text-xs mb-2">Half of all funds collected are donated to GiveWell.com's Top Charities Fund</div>
            {tiers.map((tier, index) => (
                <div key={index} className="mb-4 border rounded-lg p-2 border-gray-500">
                <PatreonButton
                    patreonClientId={patreonClientId}
                    amount={tier.amount}
                    redirectURI={redirectURI}
                />
                <ul className="text-white mt-2 list-disc list-inside">
                  {tier.benefits.map((benefit, i) => <li key={i}>{benefit}</li>)}
                </ul>
                </div>
            ))}
            <Button isCancel onClick={closeModal} className="mt-2">
                Cancel
            </Button>
        </>
        ) : (
            <PleaseLogIn/>
        )}
    </ReactModal>
  );
};