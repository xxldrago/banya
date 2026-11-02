import { prisma } from "@/shared/db/client";
import { AdCampaign, Venue } from "@prisma/client";

export class BoostService {
  async createBoost(venueId: string, data: any): Promise<AdCampaign> {
    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new Error("Venue not found");

    const campaign = await prisma.adCampaign.create({
      data: {
        partnerId: venue.partnerId,
        title: data.title,
        type: data.type,
        imageUrl: data.imageUrl,
        targetUrl: data.targetUrl,
        budget: data.budget,
        status: "active",
        startsAt: data.startsAt || new Date(),
        endsAt: data.endsAt,
      },
    });

    return campaign;
  }

  async getVenueCampaigns(venueId: string): Promise<AdCampaign[]> {
    return await prisma.adCampaign.findMany({
      where: { partner: { venues: { some: { id: venueId } } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateCampaignStatus(campaignId: string, status: string): Promise<AdCampaign> {
    return await prisma.adCampaign.update({
      where: { id: campaignId },
      data: { status },
    });
  }
}

export async function createBoostCampaign(venueId: string, data: any): Promise<AdCampaign> {
  return new BoostService().createBoost(venueId, data);
}